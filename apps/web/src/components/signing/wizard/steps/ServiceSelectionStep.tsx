'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileCheck, Stamp, Shield, PenTool } from 'lucide-react'
import { toast } from 'sonner'
import { useSigningWizard, type SigningProduct } from '../WizardContext'
import { getCurrencyForCountrySync, getLocalizedProductPrice } from '@/lib/pricing/countries-sync'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

// Helper para obtener precio del producto según país
function getProductPrice(product: SigningProduct, countryCode: string): number {
  return getLocalizedProductPrice(product, countryCode)
}

// Mapeo de slugs de firma permitidos según servicio notarial
// Orden: FES → FESB → FES+ClaveÚnica → FEA
const ALLOWED_SIGNATURES: Record<string, string[]> = {
  none: ['fes_cl', 'fesb_cl', 'fea_cl'],
  legalized_copy: ['fes_cl', 'fesb_cl', 'fea_cl'],
  protocolization: ['fes_cl', 'fesb_cl', 'fea_cl'],
  notary_authorized: ['fes_claveunica_cl', 'fea_cl'], // FAN solo permite FES+ClaveÚnica o FEA
}

// Iconos para servicios notariales
const NOTARY_ICONS: Record<string, React.ReactNode> = {
  none: <FileCheck className="h-5 w-5" />,
  legalized_copy: <Stamp className="h-5 w-5" />,
  protocolization: <Shield className="h-5 w-5" />,
  notary_authorized: <PenTool className="h-5 w-5" />,
}

export function ServiceSelectionStep() {
  const supabase = useMemo(() => createClient(), [])
  const { state, actions } = useSigningWizard()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [products, setProducts] = useState<SigningProduct[]>([])

  // Primero se selecciona el servicio notarial
  const [notarySlug, setNotarySlug] = useState<string>(
    state.notaryProduct?.notary_service || 'none'
  )
  // Luego el tipo de firma
  const [signatureId, setSignatureId] = useState<string>(state.signatureProduct?.id || '')

  // Productos por categoría
  const signatureProducts = useMemo(
    () => products.filter((p) => p.category === 'signature_type').sort((a, b) => a.display_order - b.display_order),
    [products]
  )

  const notaryProducts = useMemo(
    () => products.filter((p) => p.category === 'notary_service').sort((a, b) => a.display_order - b.display_order),
    [products]
  )

  // Firmas permitidas según el servicio notarial seleccionado
  const allowedSignatures = useMemo(() => {
    const allowed = ALLOWED_SIGNATURES[notarySlug] || ALLOWED_SIGNATURES.none
    return signatureProducts.filter((p) => allowed.includes(p.slug))
  }, [notarySlug, signatureProducts])

  // Cuando cambia el servicio notarial, resetear firma si ya no está permitida
  useEffect(() => {
    if (signatureId) {
      const currentSignature = signatureProducts.find((p) => p.id === signatureId)
      if (currentSignature) {
        const allowed = ALLOWED_SIGNATURES[notarySlug] || ALLOWED_SIGNATURES.none
        if (!allowed.includes(currentSignature.slug)) {
          setSignatureId('')
        }
      }
    }
  }, [notarySlug, signatureId, signatureProducts])

  const loadProducts = useCallback(async () => {
    // No intentar cargar si no hay un código de país definido
    if (!state.countryCode) {
      console.warn('[ServiceSelectionStep] No hay countryCode definido, esperando...')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('signing_products')
        .select('*')
        .eq('country_code', state.countryCode)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) {
        console.error('[ServiceSelectionStep] Supabase error fetching products:', fetchError)
        // Si el error es de permisos, es probable que falte RLS público.
        // En modo invitado, esto es crítico pero no queremos un crash.
        if (fetchError.code === '42501') {
          setError('No tienes permisos para ver los productos. Por favor contacta a soporte.')
        } else {
          throw fetchError
        }
        return
      }

      const normalized = (data || []).map((p: any) => ({
        ...p,
        price_usd: Number(p.price_usd ?? 0),
        price_clp: Number(p.price_clp ?? 0),
        price_ars: Number(p.price_ars ?? 0),
        price_cop: Number(p.price_cop ?? 0),
        price_mxn: Number(p.price_mxn ?? 0),
        price_pen: Number(p.price_pen ?? 0),
        price_brl: Number(p.price_brl ?? 0),
        display_order: Number(p.display_order ?? 0),
      })) as SigningProduct[]

      setProducts(normalized)
    } catch (e: any) {
      console.error('[ServiceSelectionStep] load error', e)
      const errorMsg = e?.message || e?.error_description || 'No se pudieron cargar los servicios.'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, state.countryCode])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const signatureSelected = useMemo(
    () => signatureProducts.find((p) => p.id === signatureId) || null,
    [signatureId, signatureProducts]
  )

  const notarySelected = useMemo(() => {
    if (notarySlug === 'none') return null
    return notaryProducts.find((p) => p.notary_service === notarySlug) || null
  }, [notarySlug, notaryProducts])

  const handleBack = useCallback(() => {
    actions.prevStep()
  }, [actions])

  const handleContinue = useCallback(async () => {
    setError(null)

    if (!signatureSelected) {
      setError('Debes seleccionar un tipo de firma para continuar.')
      return
    }

    try {
      setIsSaving(true)

      // Guardar en contexto
      actions.setSignatureProduct(signatureSelected)
      actions.setNotaryProduct(notarySelected)

      // Si no hay documentId (flujo público), solo avanzamos de paso.
      // Los datos ya están en el contexto global del wizard.
      if (!state.documentId) {
        actions.nextStep()
        return
      }

      // Si hay documentId, persistimos en la base de datos
      const { data: doc, error: docError } = await supabase
        .from('signing_documents')
        .select('metadata')
        .eq('id', state.documentId)
        .single()

      if (docError) throw docError

      const currentMeta = (doc?.metadata || {}) as Record<string, any>
      const currency = getCurrencyForCountrySync(state.countryCode);
      const signaturePrice = getProductPrice(signatureSelected, state.countryCode);
      const notaryPrice = notarySelected ? getProductPrice(notarySelected, state.countryCode) : 0;

      const nextMeta = {
        ...currentMeta,
        country_code: state.countryCode,
        signature_product: {
          id: signatureSelected.id,
          slug: signatureSelected.slug,
          name: signatureSelected.name,
          identifier_type: signatureSelected.identifier_type,
          billing_unit: signatureSelected.billing_unit,
          unit_price: signaturePrice,
          currency: currency,
        },
        notary_product: notarySelected
          ? {
              id: notarySelected.id,
              slug: notarySelected.slug,
              name: notarySelected.name,
              notary_service: notarySelected.notary_service,
              billing_unit: notarySelected.billing_unit,
              unit_price: notaryPrice,
              currency: currency,
            }
          : null,
      }

      const notaryService =
        notarySelected?.notary_service && typeof notarySelected.notary_service === 'string'
          ? notarySelected.notary_service
          : 'none'

      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          notary_service: notaryService,
          metadata: nextMeta,
        })
        .eq('id', state.documentId)

      if (updateError) throw updateError

      toast.success('Servicios guardados')
      actions.nextStep()
    } catch (e: any) {
      console.error('[ServiceSelectionStep] save error', e)
      setError(e?.message || 'No se pudieron guardar los servicios.')
    } finally {
      setIsSaving(false)
    }
  }, [actions, notarySelected, signatureSelected, state.countryCode, state.documentId, supabase])

  // Opciones de servicio notarial (siempre las mismas 4)
  const notaryOptions = useMemo(() => {
    const baseOptions: Array<{
      slug: string
      name: string
      description: string
      price: string | null
      billingUnit: string | null
    }> = [
      {
        slug: 'none',
        name: 'Ninguno',
        description: 'Solo firma electrónica, sin intervención notarial.',
        price: null,
        billingUnit: null,
      },
    ]

    // Agregar opciones de productos notariales
    const currency = getCurrencyForCountrySync(state.countryCode);
    notaryProducts.forEach((p) => {
      if (p.notary_service) {
        const price = getProductPrice(p, state.countryCode);
        baseOptions.push({
          slug: p.notary_service,
          name: p.name,
          description: p.description || '',
          price: price > 0 ? formatMoney(price, currency) : null,
          billingUnit: p.billing_unit === 'per_signer' ? 'firmante' : 'documento',
        })
      }
    })

    return baseOptions
  }, [notaryProducts])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 2 · Selección de Servicios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando servicios para {state.countryCode}...
          </div>
        ) : (
          <>
            {/* PASO 1: Servicio Notarial */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">1. Servicio Notarial</div>
              <p className="text-xs text-muted-foreground">
                Selecciona si necesitas que una notaría intervenga en el proceso.
              </p>

              <RadioGroup value={notarySlug} onValueChange={setNotarySlug} className="space-y-3">
                {notaryOptions.map((opt) => (
                  <div
                    key={opt.slug}
                    className={[
                      'flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer',
                      notarySlug === opt.slug
                        ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]'
                        : 'hover:border-[var(--tp-lines)]',
                    ].join(' ')}
                    onClick={() => setNotarySlug(opt.slug)}
                  >
                    <RadioGroupItem value={opt.slug} id={`notary-${opt.slug}`} className="mt-1" />
                    <Label htmlFor={`notary-${opt.slug}`} className="flex-1 cursor-pointer space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--tp-buttons)]">
                          {NOTARY_ICONS[opt.slug] || <FileCheck className="h-5 w-5" />}
                        </span>
                        <span className="text-sm font-semibold">{opt.name}</span>
                      </div>
                      {opt.description && (
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      )}
                      {opt.price && (
                        <div className="text-xs font-semibold text-[var(--tp-buttons)]">
                          {opt.price}
                          {opt.billingUnit && (
                            <span className="text-muted-foreground font-normal"> / {opt.billingUnit}</span>
                          )}
                        </div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* PASO 2: Tipo de Firma */}
            <div className="space-y-3">
              <div className="text-sm font-semibold">2. Tipo de Firma Electrónica</div>
              <p className="text-xs text-muted-foreground">
                {notarySlug === 'notary_authorized'
                  ? 'Para FAN®, solo puedes usar FES+ClaveÚnica o FEA.'
                  : 'Selecciona el tipo de firma que usarán los firmantes.'}
              </p>

              {allowedSignatures.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay tipos de firma disponibles para este país.
                </p>
              ) : (
                <RadioGroup value={signatureId} onValueChange={setSignatureId} className="space-y-3">
                  {allowedSignatures.map((p) => (
                    <div
                      key={p.id}
                      className={[
                        'flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer',
                        signatureId === p.id
                          ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]'
                          : 'hover:border-[var(--tp-lines)]',
                      ].join(' ')}
                      onClick={() => setSignatureId(p.id)}
                    >
                      <RadioGroupItem value={p.id} id={`sig-${p.id}`} className="mt-1" />
                      <Label htmlFor={`sig-${p.id}`} className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">{p.name}</div>
                          <div className="text-sm font-semibold text-[var(--tp-buttons)]">
                            {(() => {
                              const price = getProductPrice(p, state.countryCode);
                              const currency = getCurrencyForCountrySync(state.countryCode);
                              return price > 0 ? formatMoney(price, currency) : 'Gratis';
                            })()}
                            <span className="text-xs text-muted-foreground">
                              {' '}
                              / {p.billing_unit === 'per_signer' ? 'firmante' : 'documento'}
                            </span>
                          </div>
                        </div>
                        {p.description && (
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Identificador:{' '}
                          <span className="font-semibold">
                            {p.identifier_type === 'rut_only' ? 'Solo RUT chileno' : 'RUT / Pasaporte / DNI / Otro'}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>



            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={handleBack} disabled={isSaving}>
                Volver
              </Button>

              <Button
                onClick={handleContinue}
                disabled={isSaving || isLoading || !signatureId}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
