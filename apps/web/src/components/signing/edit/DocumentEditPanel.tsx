'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, UploadCloud, RefreshCw, AlertTriangle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'

interface DocumentEditPanelProps {
  document: any
  onUpdate: () => void
}

export function DocumentEditPanel({ document, onUpdate }: DocumentEditPanelProps) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  
  const [isUploading, setIsUploading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados derivados
  const canEdit = !['signed', 'notarized', 'completed', 'cancelled', 'rejected'].includes(document.status)
  const hasSigned = Number(document.signed_count || 0) > 0
  const resendActive = document.metadata?.resend?.active === true
  const invalidatedCount = Number(document.metadata?.resend?.invalidated_signatures_count || 0)

  // Dropzone setup
  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    try {
      setIsUploading(true)
      setError(null)

      // 1. Subir nuevo archivo (sobrescribir o nueva ruta)
      const path = `${document.organization_id}/${document.id}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('docs-originals')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // 2. Actualizar referencia en BD
      const { error: dbError } = await supabase
        .from('signing_documents')
        .update({
          original_file_path: path,
          original_file_name: file.name,
          original_file_size: file.size,
          updated_at: new Date().toISOString()
        })
        .eq('id', document.id)

      if (dbError) throw dbError

      toast.success('Documento actualizado correctamente')
      onUpdate()
    } catch (e: any) {
      console.error('Error updating document:', e)
      setError(e?.message || 'Error al actualizar el documento')
      toast.error('Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading || (!canEdit && !resendActive)
  })

  // Inicia el modo de re-envío invalidando firmas existentes
  const handleBeginResend = async () => {
    setError(null)
    setIsResending(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('begin_document_resend', {
        p_document_id: document.id
      })

      if (rpcError) throw new Error(rpcError.message)
      
      const result = data as { success?: boolean, invalidated_signatures_count?: number, message?: string }
      
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
        p_document_id: document.id
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
            unit_price: costResult.unit_price
          }
        })
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
              order_id: orderResult.orderId
            }
          }
        })
        .eq('id', document.id)

      if (updateError) {
        console.error('[DocumentEditPanel] update order error', updateError)
        // No bloqueamos, el checkout debería funcionar igual por metadatos
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

  // Si hay firmas y no estamos en modo re-envío, mostrar botón para iniciar re-envío
  if (hasSigned && !resendActive) {
    return (
      <div className="border rounded-lg p-6 bg-orange-50 border-orange-200 text-center space-y-4">
        <div className="flex justify-center">
          <AlertTriangle className="h-10 w-10 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-orange-900">Documento parcialmente firmado</h3>
          <p className="text-sm text-orange-700 mt-1">
            Ya existen {document.signed_count} firma(s). Para modificar el documento o los firmantes, 
            es necesario invalidar las firmas actuales y reiniciar el proceso.
          </p>
          <p className="text-xs text-orange-600 mt-2 font-medium">
            Nota: Se cobrará nuevamente por las firmas ya realizadas que se invaliden.
          </p>
        </div>
        <Button 
          onClick={handleBeginResend} 
          disabled={isResending}
          variant="outline"
          className="bg-white border-orange-300 text-orange-800 hover:bg-orange-100"
        >
          {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Reiniciar Proceso (Re-envío)
        </Button>
      </div>
    )
  }

  // Si estamos en modo re-envío y hay deuda pendiente
  if (resendActive && invalidatedCount > 0 && document.status === 'draft' && (!document.order_id || document.payment_status !== 'paid')) {
    // Nota: payment_status no existe en documents, se infiere del order_id. 
    // Aquí asumimos que si está en draft y tiene invalidatedCount > 0, debe pagar.
    // Una lógica más robusta revisaría el estado de la orden asociada.
    
    return (
      <div className="border rounded-lg p-6 bg-blue-50 border-blue-200 text-center space-y-4">
        <div className="flex justify-center">
          <FileText className="h-10 w-10 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-blue-900">Pago pendiente por re-envío</h3>
          <p className="text-sm text-blue-700 mt-1">
            Se invalidaron {invalidatedCount} firma(s). Debes regularizar el pago para poder enviar nuevamente el documento.
          </p>
        </div>
        <Button 
          onClick={handlePayResend} 
          disabled={isResending}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {isResending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Pagar y Continuar'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--tp-brand)] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {isUploading ? (
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          ) : (
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="text-sm font-medium">
            {isUploading ? 'Subiendo...' : 'Arrastra un nuevo PDF aquí o haz clic para reemplazar'}
          </div>
          <div className="text-xs text-muted-foreground">
            Archivo actual: {document.original_file_name}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-100">
          {error}
        </div>
      )}
    </div>
  )
}
