import { stripe } from './client'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

interface CreateStripeRefundParams {
  orderId: string
  paymentId: string
  amount: number
  currency: string
  reason?: string
}

interface StripeRefundResult {
  success: boolean
  refundId?: string
  refund?: Stripe.Refund
  error?: string
}

/**
 * Crea un reembolso en Stripe para un pedido
 * 
 * @param params - Parámetros del reembolso
 * @returns Resultado del reembolso
 */
export async function createStripeRefund(
  params: CreateStripeRefundParams
): Promise<StripeRefundResult> {
  const supabase = createServiceRoleClient()

  try {
    // Obtener información del pago
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', params.paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error(`Pago no encontrado: ${paymentError?.message}`)
    }

    if (payment.provider !== 'stripe') {
      throw new Error('Este pago no es de Stripe')
    }

    if (payment.status !== 'completed') {
      throw new Error('El pago no está completado, no se puede reembolsar')
    }

    // El provider_payment_id puede ser un PaymentIntent ID o Charge ID
    const paymentIntentId = payment.provider_payment_id

    // Obtener el PaymentIntent para encontrar el Charge ID
    let chargeId: string | undefined

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      // El charge ID está en paymentIntent.latest_charge
      if (paymentIntent.latest_charge) {
        chargeId = typeof paymentIntent.latest_charge === 'string' 
          ? paymentIntent.latest_charge 
          : paymentIntent.latest_charge.id
      } else if (paymentIntent.charges?.data?.[0]?.id) {
        chargeId = paymentIntent.charges.data[0].id
      }
    } catch (error: any) {
      // Si no es un PaymentIntent, intentar como Charge ID directamente
      console.log('[createStripeRefund] Intentando como Charge ID:', paymentIntentId)
      chargeId = paymentIntentId
    }

    if (!chargeId) {
      throw new Error('No se pudo encontrar el Charge ID para el reembolso')
    }

    // Convertir monto a centavos (o unidades según la moneda)
    const zeroDecimalCurrencies = ['CLP', 'JPY', 'KRW', 'VND', 'BIF', 'DJF', 'GNF', 'KMF', 'MGA', 'PYG', 'RWF', 'UGX', 'VUV', 'XAF', 'XOF', 'XPF']
    const isZeroDecimal = zeroDecimalCurrencies.includes(params.currency.toUpperCase())
    const refundAmount = isZeroDecimal 
      ? Math.round(params.amount) 
      : Math.round(params.amount * 100)

    // Crear reembolso en Stripe
    const refundParams: Stripe.RefundCreateParams = {
      charge: chargeId,
      amount: refundAmount,
      reason: params.reason as Stripe.RefundCreateParams.Reason | undefined,
      metadata: {
        order_id: params.orderId,
        payment_id: params.paymentId,
      },
    }

    const refund = await stripe.refunds.create(refundParams)

    console.log('[createStripeRefund] Reembolso creado:', {
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      orderId: params.orderId,
    })

    return {
      success: true,
      refundId: refund.id,
      refund,
    }
  } catch (error: any) {
    console.error('[createStripeRefund] Error:', {
      orderId: params.orderId,
      paymentId: params.paymentId,
      error: error.message,
    })

    return {
      success: false,
      error: error.message || 'Error al crear el reembolso',
    }
  }
}

/**
 * Obtiene el estado de un reembolso de Stripe
 * 
 * @param refundId - ID del reembolso en Stripe
 * @returns Estado del reembolso
 */
export async function getStripeRefundStatus(refundId: string): Promise<Stripe.Refund | null> {
  try {
    const refund = await stripe.refunds.retrieve(refundId)
    return refund
  } catch (error: any) {
    console.error('[getStripeRefundStatus] Error:', {
      refundId,
      error: error.message,
    })
    return null
  }
}

