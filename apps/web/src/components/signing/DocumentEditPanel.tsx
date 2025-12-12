'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentEditPanelProps {
  document: any
  onUpdate: () => void
}

export function DocumentEditPanel({ document, onUpdate }: DocumentEditPanelProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados derivados
  const canEdit = !['signed', 'notarized', 'completed', 'cancelled', 'rejected'].includes(document.status)
  const hasSigned = Number(document.signed_count || 0) > 0
  const resendActive = document.metadata?.resend?.active === true
  const invalidatedCount = Number(document.metadata?.resend?.invalidated_signatures_count || 0)

  const handleUpload = async () => {
    setError(null)

    if (!canEdit) {
      setError('Este documento ya no se puede modificar.')
      return
    }

    if (hasSigned) {
      setError('Este documento ya tiene firmas realizadas. Para reemplazarlo, debes rehacer el pedido (pago por re-envío).')
      return
    }

    if (!file) {
      setError('Debes seleccionar un PDF')
      return
    }

    if (file.type !== 'application/pdf') {
      setError('Solo se permite PDF')
      return
    }

    try {
      setIsSaving(true)

      // Obtener próxima versión
      const { data: latestVersion } = await supabase
        .from('signing_document_versions')
        .select('version_number')
        .eq('document_id', document.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextVersion = (latestVersion?.version_number ? Number(latestVersion.version_number) : 0) + 1

      const orgId = document.organization_id
      const path = `${orgId}/${document.id}/v${nextVersion}/original.pdf`

      // Subir a docs-originals
      const { error: uploadError } = await supabase.storage
        .from('docs-originals')
        .upload(path, file, { contentType: 'application/pdf', upsert: true })

      if (uploadError) throw new Error(uploadError.message)

      // Actualizar documento
      const nextMeta = {
        ...(document.metadata || {}),
        originals_bucket: 'docs-originals',
        originals_version: nextVersion,
      }

      const { error: docUpdateError } = await supabase
        .from('signing_documents')
        .update({
          original_file_path: path,
          original_file_name: file.name,
          original_file_size: file.size,
          original_file_type: 'application/pdf',
          metadata: nextMeta,
        })
        .eq('id', document.id)

      if (docUpdateError) throw new Error(docUpdateError.message)

      // Insertar versión
      const { data: auth } = await supabase.auth.getUser()

      await supabase.from('signing_document_versions').insert({
        document_id: document.id,
        version_number: nextVersion,
        version_type: 'original',
        file_path: path,
        file_name: file.name,
        file_size: file.size,
        created_by: auth?.user?.id || null,
      })

      toast.success('Documento reemplazado')
      setFile(null)
      onUpdate()
    } catch (e: any) {
      console.error('[DocumentEditPanel] upload error', e)
      setError(e?.message || 'No se pudo reemplazar el documento.')
    } finally {
      setIsSaving(false)
    }
  }

  // Inicia el modo de re-envío invalidando firmas existentes
  const handleBeginResend = async () => {
    setError(null)
    setIsResending(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('begin_document_resend', {
        p_document_id: document.id,
      })

      if (rpcError) throw new Error(rpcError.message)

      const result = data as { success?: boolean; invalidated_signatures_count?: number; message?: string }

      if (!result?.success) {
        throw new Error('No se pudo iniciar el re-envío')
      }

      const invalidated = result.invalidated_signatures_count || 0

      if (invalidated > 0) {
        toast.info(`Se invalidaron ${invalidated} firma(s). Debes pagar antes de continuar.`)
      } else {
        toast.success('Documento listo para re-envío (sin firmas que pagar).')
      }

      onUpdate()
    } catch (e: any) {
      console.error('[DocumentEditPanel] resend error', e)
      setError(e?.message || 'No se pudo iniciar el modo re-envío.')
    } finally {
      setIsResending(false)
    }
  }

  // Calcula el costo y redirige a checkout para pagar firmas invalidadas
  const handlePayResend = async () => {
    setError(null)
    setIsResending(true)

    try {
      // 1. Calcular costo
      const { data: costData, error: costError } = await supabase.rpc('calculate_resend_cost', {
        p_document_id: document.id,
      })

      if (costError) throw new Error(costError.message)

      const costResult = costData as {
        success?: boolean
        invalidated_signatures_count?: number
        unit_price?: number
        currency?: string
        total?: number
      }

      if (!costResult?.success) {
        throw new Error('No se pudo calcular el costo de re-envío')
      }

      const total = costResult.total || 0

      if (total <= 0) {
        toast.success('No hay monto a pagar. Puedes continuar editando.')
        onUpdate()
        return
      }

      // 2. Crear orden vía API
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'electronic_signature_resend',
          metadata: {
            amount: total,
            currency: costResult.currency || 'CLP',
            document_id: document.id,
            invalidated_signatures_count: costResult.invalidated_signatures_count,
            unit_price: costResult.unit_price,
          },
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Error creando orden de re-envío')
      }

      const orderResult = await res.json()

      // 3. Actualizar documento con la nueva orden
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          order_id: orderResult.orderId,
          metadata: {
            ...(document.metadata || {}),
            resend: {
              ...(document.metadata?.resend || {}),
              order_id: orderResult.orderId,
            },
          },
        })
        .eq('id', document.id)

      if (updateError) {
        console.error('[DocumentEditPanel] update order error', updateError)
      }

      // 4. Redirigir a checkout
      toast.info('Redirigiendo al checkout...')
      router.push(orderResult.checkoutUrl || `/checkout/${orderResult.orderId}`)
    } catch (e: any) {
      console.error('[DocumentEditPanel] pay resend error', e)
      setError(e?.message || 'No se pudo procesar el pago de re-envío.')
    } finally {
      setIsResending(false)
    }
  }

  // Determinar si puede subir archivo (sin firmas o en modo re-envío sin costo pendiente)
  const canUpload = canEdit && (!hasSigned || resendActive) && invalidatedCount === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reemplazar documento</CardTitle>
        <CardDescription>
          {resendActive
            ? 'Modo re-envío activo. Puedes subir el PDF corregido.'
            : 'Si aún no hay firmas realizadas, puedes subir un PDF corregido.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canEdit && (
          <Alert>
            <AlertDescription>
              Este documento ya está finalizado y no permite cambios.
            </AlertDescription>
          </Alert>
        )}

        {/* Caso: hay firmas y NO está en modo re-envío */}
        {hasSigned && !resendActive && canEdit && (
          <Alert className="border-amber-500 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Este documento tiene <strong>{document.signed_count}</strong> firma(s) realizada(s).
              Para modificarlo, debes activar el modo re-envío. Las firmas realizadas se invalidarán
              y tendrás que pagar por ellas antes de continuar.
            </AlertDescription>
          </Alert>
        )}

        {/* Caso: modo re-envío activo con firmas invalidadas pendientes de pago */}
        {resendActive && invalidatedCount > 0 && (
          <Alert className="border-blue-500 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Modo re-envío activo.</strong> Tienes <strong>{invalidatedCount}</strong> firma(s)
              invalidada(s) pendiente(s) de pago. Debes pagar antes de poder subir un nuevo documento.
            </AlertDescription>
          </Alert>
        )}

        {/* Caso: modo re-envío activo sin costo pendiente */}
        {resendActive && invalidatedCount === 0 && (
          <Alert className="border-green-500 bg-green-50">
            <RefreshCw className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Modo re-envío activo.</strong> Puedes subir el PDF corregido.
            </AlertDescription>
          </Alert>
        )}

        {/* Botón para activar modo re-envío */}
        {hasSigned && !resendActive && canEdit && (
          <Button
            onClick={handleBeginResend}
            disabled={isResending}
            variant="outline"
            className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Activar modo re-envío
              </>
            )}
          </Button>
        )}

        {/* Botón para pagar firmas invalidadas */}
        {resendActive && invalidatedCount > 0 && (
          <Button
            onClick={handlePayResend}
            disabled={isResending}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando costo...
              </>
            ) : (
              `Pagar ${invalidatedCount} firma(s) invalidada(s)`
            )}
          </Button>
        )}

        {/* Input de archivo y botón de subida */}
        <div className="space-y-2">
          <Label>PDF corregido</Label>
          <Input
            type="file"
            accept="application/pdf"
            disabled={!canUpload || isSaving}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-muted-foreground">Solo PDF.</p>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!canUpload || isSaving || !file}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            'Reemplazar PDF'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

