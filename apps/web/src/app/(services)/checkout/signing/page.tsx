'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Info, 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Building2, 
  User, 
  FileText, 
  Package, 
  AlertCircle,
  Mail,
  Smartphone
} from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard } from '@/components/signing/wizard/WizardContext'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useOrganization } from '@/hooks/useOrganization'
import { useSignedUrl } from '@/hooks/useSignedUrl'
import { getCurrencyForCountrySync, getLocalizedProductPrice } from '@/lib/pricing/countries-sync'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

export default function SigningCheckoutPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const pathname = usePathname()
  const { state, actions, isInitialized } = useSigningWizard()
  const { activeOrganization, isLoading: orgLoading } = useOrganization()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [user, setUser] = useState<any>(null)
  const [documentFileSize, setDocumentFileSize] = useState<number | null>(null)
  const [documentFileName, setDocumentFileName] = useState<string | null>(null)
  const [documentFilePath, setDocumentFilePath] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Obtener URL firmada si hay documentId y filePath
  const { signedUrl: storageSignedUrl } = useSignedUrl(
    'docs-originals',
    documentFilePath,
    3600
  )

  // Verificar autenticación y cargar información del documento si existe
  useEffect(() => {
    const checkAuthAndLoadDocument = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
      setUser(user)

      // Si hay documentId, cargar información del documento desde la DB
      if (state.documentId) {
        const { data: doc, error: docError } = await supabase
          .from('signing_documents')
          .select('original_file_name, original_file_size, original_file_path')
          .eq('id', state.documentId)
          .single()

        if (!docError && doc) {
          setDocumentFileName(doc.original_file_name)
          setDocumentFileSize(doc.original_file_size)
          setDocumentFilePath(doc.original_file_path)
        }
      }

      setIsLoading(false)
    }
    checkAuthAndLoadDocument()
  }, [supabase, state.documentId])

  // Generar URL de previsualización: desde Storage si hay documentId, o desde File si está en memoria
  useEffect(() => {
    if (state.file) {
      // Archivo en memoria: crear blob URL
      const url = URL.createObjectURL(state.file)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else if (storageSignedUrl) {
      // Archivo en Storage: usar URL firmada
      setPreviewUrl(storageSignedUrl)
    } else {
      setPreviewUrl(null)
    }
  }, [state.file, storageSignedUrl])

  const signature = state.signatureProduct
  const notary = state.notaryProduct
  const signersCount = state.signers.length
  const currency = getCurrencyForCountrySync(state.countryCode)

  const signatureSubtotal = useMemo(() => {
    if (!signature) return 0
    const unit = getLocalizedProductPrice(signature, state.countryCode)
    return signature.billing_unit === 'per_signer' ? unit * signersCount : unit
  }, [signature, signersCount, state.countryCode])

  const notarySubtotal = useMemo(() => {
    if (!notary) return 0
    return getLocalizedProductPrice(notary, state.countryCode)
  }, [notary, state.countryCode])

  const total = useMemo(() => signatureSubtotal + notarySubtotal, [notarySubtotal, signatureSubtotal])

  const handleConfirm = useCallback(async () => {
    setError(null)

    if (!state.file && !state.documentId) {
      setError('No encontramos el documento. Por favor vuelve al paso anterior y cárgalo de nuevo.')
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
        // Intentar obtener la organización del usuario si activeOrganization aún no cargó
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()
        
        if (orgUser?.organization_id) {
          organizationId = orgUser.organization_id
        } else {
          // Si realmente no tiene, crear una personal
          const { data: newOrgId, error: orgError } = await supabase.rpc('create_personal_organization', {
            user_id: user.id,
            user_email: user.email,
            user_first_name: null
          })
          if (orgError) throw new Error('No se pudo crear tu organización personal.')
          organizationId = newOrgId
        }
        actions.setOrgId(organizationId)
      }

      if (!organizationId) throw new Error('No pudimos determinar tu organización. Intenta recargar la página.')

      // 2. Asegurar Documento en DB
      let currentDocId = state.documentId

      if (!currentDocId) {
        // a) Crear documento
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

        if (createError || !newDoc?.id) throw new Error(createError?.message || 'Error al crear el documento.')
        currentDocId = newDoc.id as string
        actions.setDocumentId(currentDocId)

        // b) Subir archivo
        const v1Path = `${organizationId}/${currentDocId}/v1/original.pdf`
        const { error: uploadError } = await supabase.storage.from('docs-originals').upload(v1Path, state.file!, {
          contentType: 'application/pdf',
          upsert: false,
        })
        if (uploadError) throw new Error(`Error al subir el archivo: ${uploadError.message}`)
        actions.setUploadedFilePath(v1Path)

        // c) Actualizar doc
        const { error: docUpdateError } = await supabase.from('signing_documents').update({
          original_file_path: v1Path,
          original_file_name: state.file!.name,
          original_file_size: state.file!.size,
          original_file_type: state.file!.type || 'application/pdf',
          status: 'draft',
          send_to_signers_on_complete: state.sendToSignersOnComplete,
          metadata: {
            country_code: state.countryCode,
            originals_bucket: 'docs-originals',
            originals_version: 1,
          }
        }).eq('id', currentDocId)
        if (docUpdateError) throw docUpdateError

        // d) Crear firmantes
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
              id: signature?.id,
              slug: signature?.slug,
              name: signature?.name,
              identifier_type: signature?.identifier_type,
              billing_unit: signature?.billing_unit,
              unit_price: getLocalizedProductPrice(signature, state.countryCode),
              quantity: signature?.billing_unit === 'per_signer' ? signersCount : 1,
              subtotal: signatureSubtotal,
            },
            notary_product: notary
              ? {
                  id: notary.id,
                  slug: notary.slug,
                  name: notary.name,
                  notary_service: notary.notary_service,
                  unit_price: getLocalizedProductPrice(notary, state.countryCode),
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
      // Redirigimos siempre a la página de checkout de la orden
      const checkoutUrl = `/checkout/${orderId}`

      if (!orderId) throw new Error('No se pudo crear la orden')

      actions.setOrderId(orderId)

      await supabase.from('signing_documents').update({ order_id: orderId }).eq('id', currentDocId)

      // Importante: No reseteamos el wizard aquí porque queremos que si algo falla en el pago
      // el usuario pueda volver. O quizás sí, ya que la orden ya existe.
      // actions.reset() 
      
      toast.success('Orden creada. Redirigiendo a pago...')
      router.push(checkoutUrl)
    } catch (e: any) {
      console.error('[SigningCheckout] error', e)
      setError(e?.message || 'No se pudo crear la orden.')
    } finally {
      setIsSubmitting(false)
    }
  }, [actions, activeOrganization?.id, currency, notary, notarySubtotal, router, signature, signatureSubtotal, signersCount, state, supabase, total, user])

  if (isLoading || !isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tp-buttons)]" />
        <p className="text-muted-foreground animate-pulse font-medium">Preparando tu solicitud...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 hover:bg-transparent -ml-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-medium">Volver a firmantes</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paso 4 de 4</span>
          <div className="h-1.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--tp-buttons)] w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Resumen de la Solicitud */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Finalizar Solicitud</h1>
            <p className="text-muted-foreground">Revisa los detalles antes de proceder al pago.</p>
          </div>

          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-[var(--tp-buttons)]" />
                Resumen de Servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-5 border border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{signature?.name || 'Tipo de firma'}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{signersCount} firmante(s)</span>
                      <span>•</span>
                      <span>{formatMoney(signature ? getLocalizedProductPrice(signature, state.countryCode) : 0, currency)} c/u</span>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-[var(--tp-buttons)]">
                    {formatMoney(signatureSubtotal, currency)}
                  </p>
                </div>

                {notary && (
                  <>
                    <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{notary.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Servicio notarial incluido
                        </p>
                      </div>
                      <p className="font-bold text-lg text-[var(--tp-buttons)]">
                        {formatMoney(notarySubtotal, currency)}
                      </p>
                    </div>
                  </>
                )}

                <div className="pt-2 border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <p className="text-lg font-extrabold">Total a pagar</p>
                  <p className="text-2xl font-black text-[var(--tp-buttons)]">
                    {formatMoney(total, currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Firmantes Designados</h3>
                  <Badge variant="secondary" className="font-bold">{signersCount}</Badge>
                </div>
                <div className="grid gap-3">
                  {state.signers.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--tp-buttons-10)] flex items-center justify-center text-[var(--tp-buttons)] font-bold">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{s.first_name} {s.last_name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{s.email}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black tracking-tighter">
                        {s.identifier_type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Documento Adjunto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{state.file?.name || documentFileName || 'Documento cargado'}</p>
                      {(() => {
                        const fileSize = state.file?.size || documentFileSize || 0
                        const sizeText = fileSize / 1024 > 1024 
                          ? `${(fileSize / 1024 / 1024).toFixed(1)} MB` 
                          : `${(fileSize / 1024).toFixed(0)} KB`
                        return <p className="text-xs text-muted-foreground">PDF • {sizeText}</p>
                      })()}
                    </div>
                  </div>
                  
                  {/* Previsualización pequeña del PDF */}
                  {previewUrl && (
                    <div className="relative rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/50 overflow-hidden">
                      <iframe
                        src={previewUrl}
                        className="w-full h-64 border-0"
                        title="Vista previa del documento"
                      />
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-zinc-50/80 dark:from-zinc-900/80 to-transparent" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Autenticación / Pago */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {!isAuthenticated ? (
            <Card className="border-[var(--tp-buttons)] border-t-4 shadow-xl overflow-hidden">
              <div className="bg-[var(--tp-buttons-10)] p-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[var(--tp-buttons)]" />
                  Identifícate para Pagar
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-400/40">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                    Tu progreso está seguro. Al ingresar, vincularemos este documento a tu cuenta para procesar el pago y seguimiento.
                  </AlertDescription>
                </Alert>

                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login" className="font-bold">Ingresar</TabsTrigger>
                    <TabsTrigger value="signup" className="font-bold">Registrarse</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <LoginForm redirectTo={pathname} />
                  </TabsContent>
                  <TabsContent value="signup" className="mt-0 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <SignupForm redirectTo={pathname} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[var(--tp-buttons)] border-t-4 shadow-xl overflow-hidden bg-white dark:bg-zinc-950">
              <div className="bg-[var(--tp-buttons-10)] p-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Confirmar y Pagar
                </h2>
              </div>
              <CardContent className="p-6 space-y-6">
                {error && (
                  <Alert variant="destructive" className="animate-in head-shake duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Usuario Autenticado</p>
                        <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Organización</p>
                        {orgLoading ? (
                          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
                        ) : (
                          <p className="font-bold truncate text-zinc-900 dark:text-zinc-100">
                            {activeOrganization?.name || 'Tu Cuenta Personal'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting || orgLoading}
                    className="w-full h-14 text-lg font-bold bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Generando orden...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-3 h-6 w-6" />
                        Confirmar {formatMoney(total, currency)}
                      </>
                    )}
                  </Button>
                  
                  <div className="space-y-4">
                    <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-4">
                      Al proceder, serás redirigido a nuestra pasarela de pagos para completar la transacción de forma segura.
                    </p>
                    <Separator className="bg-zinc-100 dark:bg-zinc-800" />
                    <div className="flex items-center justify-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
                      {/* Placeholder para logos de medios de pago */}
                      <div className="text-[10px] font-black tracking-widest uppercase">WEBPAY</div>
                      <div className="text-[10px] font-black tracking-widest uppercase">STRIPE</div>
                      <div className="text-[10px] font-black tracking-widest uppercase">VISA/MC</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
