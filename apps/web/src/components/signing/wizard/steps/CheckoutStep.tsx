'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard } from '../WizardContext'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/hooks/useOrganization'
import { usePathname } from 'next/navigation'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export function CheckoutStep() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const { state, actions } = useSigningWizard()
  const { activeOrganization, isLoading: orgLoading } = useOrganization()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)

  const [documentTitle, setDocumentTitle] = useState<string | null>(null)

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setUser(user)
    }
    checkAuth()
  }, [supabase])

  const signature = state.signatureProduct
  const notary = state.notaryProduct

  const signersCount = state.signers.length

  const currency = signature?.currency || notary?.currency || 'CLP'

  const signatureSubtotal = useMemo(() => {
    if (!signature) return 0
    const unit = Number(signature.base_price ?? 0)
    return signature.billing_unit === 'per_signer' ? unit * signersCount : unit
  }, [signature, signersCount])

  const notarySubtotal = useMemo(() => {
    if (!notary) return 0
    return Number(notary.base_price ?? 0)
  }, [notary])

  const total = useMemo(() => signatureSubtotal + notarySubtotal, [notarySubtotal, signatureSubtotal])

  const loadDocument = useCallback(async () => {
    if (!state.documentId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('signing_documents')
        .select('title')
        .eq('id', state.documentId)
        .single()

      if (fetchError) throw fetchError
      setDocumentTitle(data?.title || null)
    } catch (e: any) {
      console.error('[CheckoutStep] load doc error', e)
      setError(e?.message || 'No se pudo cargar el documento.')
    } finally {
      setIsLoading(false)
    }
  }, [state.documentId, supabase])

  useEffect(() => {
    loadDocument()
  }, [loadDocument])

  const handleBack = useCallback(() => {
    actions.prevStep()
  }, [actions])

  const handleConfirm = useCallback(async () => {
    setError(null)

    if (!state.file && !state.documentId) {
      setError('No encontramos el documento.')
      return
    }
    if (!signature) {
      setError('Debes seleccionar un tipo de firma.')
      return
    }
    if (signersCount === 0) {
      setError('Debes agregar al menos 1 firmante.')
      return
    }

    try {
      setIsSubmitting(true)

      // 1. Asegurar Organización
      let organizationId = state.orgId || activeOrganization?.id

      if (!organizationId && user) {
        // Si no hay org pero hay user, intentar crear org personal automática
        const { data: newOrgId, error: orgError } = await supabase.rpc('create_personal_organization', {
          user_id: user.id,
          user_email: user.email,
          user_first_name: null
        })
        if (orgError) {
          console.error('[CheckoutStep] Error creating organization:', orgError)
          throw new Error('No se pudo crear tu organización personal.')
        }
        organizationId = newOrgId
        actions.setOrgId(newOrgId)
      }

      if (!organizationId) {
        throw new Error('No pudimos determinar tu organización.')
      }

      // 2. Asegurar Documento en DB (si venimos del flujo público)
      let currentDocId = state.documentId

      if (!currentDocId) {
        // a) Crear documento (draft)
        const safeTitle = state.file?.name.replace(/\.pdf$/i, '') || 'Sin título'
        const { data: newDoc, error: createError } = await supabase.rpc('create_signing_document', {
          p_organization_id: organizationId,
          p_title: safeTitle,
          p_description: null,
          p_signing_order: state.signingOrder,
          p_notary_service: state.notaryProduct?.notary_service || 'none',
          p_requires_approval: false,
          p_requires_ai_review: state.requiresAiReview,
          p_order_id: null,
        })

        if (createError || !newDoc?.id) throw new Error(createError?.message || 'Error al crear el documento en la base de datos.')
        currentDocId = newDoc.id as string
        actions.setDocumentId(currentDocId)

        // b) Subir archivo a Storage
        const v1Path = `${organizationId}/${currentDocId}/v1/original.pdf`
        const { error: uploadError } = await supabase.storage.from('docs-originals').upload(v1Path, state.file!, {
          contentType: 'application/pdf',
          upsert: false,
        })
        if (uploadError) throw new Error(`Error al subir el archivo: ${uploadError.message}`)
        actions.setUploadedFilePath(v1Path)

        // c) Actualizar documento con referencia al archivo
        const { error: docUpdateError } = await supabase.from('signing_documents').update({
          original_file_path: v1Path,
          original_file_name: state.file!.name,
          original_file_size: state.file!.size,
          original_file_type: state.file!.type || 'application/pdf',
          status: 'draft',
          metadata: {
            country_code: state.countryCode,
            originals_bucket: 'docs-originals',
            originals_version: 1,
          }
        }).eq('id', currentDocId)
        
        if (docUpdateError) throw docUpdateError

        // d) Crear firmantes en DB
        for (const [idx, s] of state.signers.entries()) {
          const fullName = `${s.first_name} ${s.last_name}`.trim()
          const { data: newSigner, error: signerError } = await supabase.rpc('add_document_signer', {
            p_document_id: currentDocId,
            p_email: s.email,
            p_full_name: fullName,
            p_rut: s.identifier_type === 'rut' ? s.identifier_value : null,
            p_phone: s.phone || null,
            p_is_foreigner: false,
            p_signing_order: idx + 1,
            p_user_id: null,
          })
          if (signerError) throw signerError
          
          // Actualizar metadata del firmante
          await supabase.from('signing_signers').update({
            first_name: s.first_name,
            last_name: s.last_name,
            metadata: {
              identifier_type: s.identifier_type,
              identifier_value: s.identifier_value,
              country_code: state.countryCode,
            }
          }).eq('id', newSigner.id)
        }
      }

      // 3. Crear orden
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'electronic_signature',
          productId: null,
          metadata: {
            amount: total,
            name: 'Servicio de Firma Electrónica',
            document_id: currentDocId,
            country_code: state.countryCode,
            signature_product: {
              id: signature.id,
              slug: signature.slug,
              name: signature.name,
              identifier_type: signature.identifier_type,
              billing_unit: signature.billing_unit,
              unit_price: Number(signature.base_price ?? 0),
              quantity: signature.billing_unit === 'per_signer' ? signersCount : 1,
              subtotal: signatureSubtotal,
            },
            notary_product: notary
              ? {
                  id: notary.id,
                  slug: notary.slug,
                  name: notary.name,
                  notary_service: notary.notary_service,
                  unit_price: Number(notary.base_price ?? 0),
                  quantity: 1,
                  subtotal: notarySubtotal,
                }
              : null,
            signers_count: signersCount,
            total,
            currency,
          },
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo crear la orden')

      const orderId = json?.orderId as string
      const checkoutUrl = (json?.checkoutUrl as string) || `/checkout/${orderId}`

      if (!orderId) throw new Error('No se pudo crear la orden')

      actions.setOrderId(orderId)

      // Vincular orden al documento
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          order_id: orderId,
        })
        .eq('id', currentDocId)

      if (updateError) throw updateError

      // ÉXITO: Limpiamos el wizard antes de ir al pago para que no quede basura en sessionStorage
      actions.reset()

      toast.success('Orden creada. Redirigiendo a pago...')
      router.push(checkoutUrl)
    } catch (e: any) {
      console.error('[CheckoutStep] confirm error', e)
      setError(e?.message || 'No se pudo crear la orden.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    actions,
    activeOrganization?.id,
    currency,
    notary,
    notarySubtotal,
    router,
    signature,
    signatureSubtotal,
    signersCount,
    state.countryCode,
    state.documentId,
    state.file,
    state.orgId,
    state.requiresAiReview,
    state.signerDrafts, // Error en mi memoria, revisaré SignerDraft[]
    state.signers,
    state.signingOrder,
    supabase,
    total,
    user,
  ])

  if (isAuthenticated === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identifícate para finalizar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-400/40">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Casi terminamos. Inicia sesión o crea una cuenta para vincular tu documento y procesar el pago. Tu progreso no se perderá.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm redirectTo={pathname} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignupForm redirectTo={pathname} />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
              Volver a editar firmantes
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 4 · Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando resumen...
          </div>
        ) : (
          <>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="text-sm font-semibold">Resumen</div>

              <div className="text-sm">
                <span className="text-muted-foreground">Documento:</span>{' '}
                <span className="font-semibold">{documentTitle || state.documentId}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{signature?.name || 'Tipo de firma'}</span>
                  <span className="font-semibold text-[var(--tp-buttons)]">
                    {formatMoney(signatureSubtotal, currency)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {signature?.billing_unit === 'per_signer'
                    ? `${signersCount} firmante(s) · ${formatMoney(Number(signature?.base_price ?? 0), currency)} c/u`
                    : `Por documento · ${formatMoney(Number(signature?.base_price ?? 0), currency)}`}
                </div>
              </div>

              {notary && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{notary.name}</span>
                      <span className="font-semibold text-[var(--tp-buttons)]">
                        {formatMoney(notarySubtotal, currency)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Servicio notarial (por documento)</div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold text-[var(--tp-buttons)]">
                  {formatMoney(total, currency)}
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="text-sm font-semibold">Firmantes</div>
              {state.signers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay firmantes.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {state.signers.map((s, idx) => (
                    <li key={`${s.email}-${idx}`} className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {s.first_name} {s.last_name} · {s.email}
                      </span>
                      <span className="text-xs text-muted-foreground">{s.identifier_type.toUpperCase()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Volver
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando orden...
                  </>
                ) : (
                  'Confirmar y pagar'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

