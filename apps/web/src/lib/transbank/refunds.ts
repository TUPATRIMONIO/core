import { transbankClient } from './client'
import { createServiceRoleClient } from '@/lib/supabase/server'

interface CreateTransbankRefundParams {
  orderId: string
  paymentId: string
  amount: number
  currency: string
  reason?: string
}

interface TransbankRefundResult {
  success: boolean
  refundId?: string
  error?: string
}

/**
 * Interfaz para respuesta de refund de Transbank
 */
interface TransbankRefundResponse {
  type: string
  authorization_code: string
  authorization_date: string
  balance: number
  nullified_amount: number
  response_code: number
}

/**
 * Crea un reembolso en Transbank para WebPay Plus
 * 
 * @param params - Parámetros del reembolso
 * @returns Resultado del reembolso
 */
export async function createTransbankWebpayRefund(
  params: CreateTransbankRefundParams
): Promise<TransbankRefundResult> {
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

    if (payment.provider !== 'transbank') {
      throw new Error('Este pago no es de Transbank')
    }

    if (payment.status !== 'completed') {
      throw new Error('El pago no está completado, no se puede reembolsar')
    }

    // El provider_payment_id es el token de la transacción
    const token = payment.provider_payment_id

    // Obtener información de la orden para obtener el buy_order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Orden no encontrada: ${orderError?.message}`)
    }

    // El buy_order puede estar en metadata del pago o generarse desde order_id
    let buyOrder: string
    if (payment.metadata && typeof payment.metadata === 'object' && 'buy_order' in payment.metadata) {
      buyOrder = (payment.metadata as any).buy_order
    } else {
      // Generar buy_order desde order_id (mismo formato que en checkout)
      const orderIdClean = params.orderId.replace(/-/g, '')
      buyOrder = `TP-${orderIdClean.substring(orderIdClean.length - 20)}`.substring(0, 26)
    }

    // Convertir monto a entero (Transbank usa CLP, zero-decimal)
    const refundAmount = Math.round(params.amount)

    console.log('[createTransbankWebpayRefund] Creando reembolso:', {
      token,
      buyOrder,
      amount: refundAmount,
      orderId: params.orderId,
    })

    // Hacer refund usando el método refund de Transbank
    // La API de Transbank requiere: token, buy_order, amount
    const refundResponse = await transbankClient.refundWebpayPlusTransaction(
      token,
      buyOrder,
      refundAmount
    )

    console.log('[createTransbankWebpayRefund] Reembolso creado:', {
      authorizationCode: refundResponse.authorization_code,
      nullifiedAmount: refundResponse.nullified_amount,
      balance: refundResponse.balance,
      responseCode: refundResponse.response_code,
    })

    // El refund_id será el authorization_code
    const refundId = refundResponse.authorization_code

    return {
      success: true,
      refundId,
    }
  } catch (error: any) {
    console.error('[createTransbankWebpayRefund] Error:', {
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
 * Crea un reembolso en Transbank para OneClick
 * 
 * @param params - Parámetros del reembolso
 * @returns Resultado del reembolso
 */
export async function createTransbankOneclickRefund(
  params: CreateTransbankRefundParams
): Promise<TransbankRefundResult> {
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

    if (payment.provider !== 'transbank') {
      throw new Error('Este pago no es de Transbank')
    }

    if (payment.status !== 'completed') {
      throw new Error('El pago no está completado, no se puede reembolsar')
    }

    // El provider_payment_id es el token de la transacción
    const token = payment.provider_payment_id

    // Obtener información de la orden para obtener el buy_order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Orden no encontrada: ${orderError?.message}`)
    }

    // El buy_order puede estar en metadata del pago o generarse desde order_id
    let buyOrder: string
    if (payment.metadata && typeof payment.metadata === 'object' && 'buy_order' in payment.metadata) {
      buyOrder = (payment.metadata as any).buy_order
    } else {
      // Generar buy_order desde order_id (mismo formato que en checkout)
      const orderIdClean = params.orderId.replace(/-/g, '')
      buyOrder = `TP-${orderIdClean.substring(orderIdClean.length - 20)}`.substring(0, 26)
    }

    // Convertir monto a entero (Transbank usa CLP, zero-decimal)
    const refundAmount = Math.round(params.amount)

    console.log('[createTransbankOneclickRefund] Creando reembolso:', {
      token,
      buyOrder,
      amount: refundAmount,
      orderId: params.orderId,
    })

    // Hacer refund usando el método refund de Transbank para OneClick
    const refundResponse = await transbankClient.refundOneclickTransaction(
      token,
      buyOrder,
      refundAmount
    )

    console.log('[createTransbankOneclickRefund] Reembolso creado:', {
      authorizationCode: refundResponse.authorization_code,
      nullifiedAmount: refundResponse.nullified_amount,
      balance: refundResponse.balance,
      responseCode: refundResponse.response_code,
    })

    // El refund_id será el authorization_code
    const refundId = refundResponse.authorization_code

    return {
      success: true,
      refundId,
    }
  } catch (error: any) {
    console.error('[createTransbankOneclickRefund] Error:', {
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

