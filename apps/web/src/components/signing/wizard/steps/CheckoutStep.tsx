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
  const { state, actions } = useSigningWizard()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [documentTitle, setDocumentTitle] = useState<string | null>(null)

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
    if (!state.documentId) return
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

    if (!state.orgId) {
      setError('No pudimos determinar tu organización.')
      return
    }
    if (!state.documentId) {
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

      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: 'electronic_signature',
          productId: null,
          metadata: {
            amount: total,
            name: 'Servicio de Firma Electrónica',
            document_id: state.documentId,
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

      // Vincular orden al documento (mantener status draft; no existe pending_payment en enum)
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({
          order_id: orderId,
        })
        .eq('id', state.documentId)

      if (updateError) throw updateError

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
    currency,
    notary,
    notarySubtotal,
    router,
    signature,
    signatureSubtotal,
    signersCount,
    state.countryCode,
    state.documentId,
    state.orgId,
    supabase,
    total,
  ])

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

