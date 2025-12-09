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
  transactionId?: string
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

    // Los pagos de Transbank completados tienen status 'succeeded' en nuestra BD
    if (payment.status !== 'succeeded' && payment.status !== 'completed') {
      throw new Error(`El pago no está completado (estado actual: ${payment.status}), no se puede reembolsar`)
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
      type: refundResponse.type,
    })

    // Validar que el reembolso fue exitoso
    if (refundResponse.response_code !== 0) {
      throw new Error(`Error en el reembolso de Transbank Webpay Plus: código de respuesta ${refundResponse.response_code}`)
    }

    // El refund_id será el authorization_code del reembolso
    const refundId = refundResponse.authorization_code

    return {
      success: true,
      refundId,
      transactionId: refundResponse.authorization_code,
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
 * Según la documentación oficial de Transbank:
 * - Para OneClick se necesita: tbk_user, authorization_code, buy_order, amount
 * - El token en la URL es el buy_order de la transacción original
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

    // Los pagos de Transbank completados tienen status 'succeeded' en nuestra BD
    if (payment.status !== 'succeeded' && payment.status !== 'completed') {
      throw new Error(`El pago no está completado (estado actual: ${payment.status}), no se puede reembolsar`)
    }

    // Para OneClick, el provider_payment_id es el buy_order (no el token)
    // Y necesitamos obtener tbk_user y authorization_code de los metadatos
    const metadata = payment.metadata && typeof payment.metadata === 'object' 
      ? payment.metadata as any 
      : {}

    const tbkUser = metadata.tbk_user
    const authorizationCode = metadata.authorization_code

    if (!tbkUser || !authorizationCode) {
      throw new Error('Faltan datos requeridos para el reembolso de OneClick: tbk_user y authorization_code deben estar en los metadatos del pago')
    }

    // Para transacciones OneClick Mall, según la documentación de Transbank:
    // - El buy_order en la URL debe ser el del Mall (buy_order principal)
    // - El body debe contener: detail_buy_order (store_buy_order de la tienda) y amount
    // - Las credenciales deben ser las del Mall
    let mallBuyOrder: string // buy_order del Mall (va en la URL)
    let detailBuyOrder: string // store_buy_order de la tienda (va en el body como detail_buy_order)
    
    if (metadata.store_buy_order && metadata.buy_order) {
      // Transacción Mall: usar buy_order del Mall en URL y store_buy_order en body
      mallBuyOrder = metadata.buy_order // buy_order del Mall
      detailBuyOrder = metadata.store_buy_order // buy_order de la tienda
      console.log('[createTransbankOneclickRefund] Transacción Mall detectada:', {
        mallBuyOrder,
        detailBuyOrder,
      })
    } else if (metadata.buy_order) {
      // Transacción directa (no Mall): usar buy_order en ambos lugares
      mallBuyOrder = metadata.buy_order
      detailBuyOrder = metadata.buy_order
      console.log('[createTransbankOneclickRefund] Transacción directa (no Mall):', {
        buyOrder: mallBuyOrder,
      })
    } else {
      // Fallback: usar provider_payment_id
      mallBuyOrder = payment.provider_payment_id
      detailBuyOrder = payment.provider_payment_id
      console.log('[createTransbankOneclickRefund] Usando provider_payment_id:', {
        buyOrder: mallBuyOrder,
      })
    }

    // Convertir monto a entero (Transbank usa CLP, zero-decimal)
    const refundAmount = Math.round(params.amount)

    console.log('[createTransbankOneclickRefund] Creando reembolso:', {
      mallBuyOrder,
      detailBuyOrder,
      storeBuyOrder: metadata.store_buy_order,
      metadataBuyOrder: metadata.buy_order,
      providerPaymentId: payment.provider_payment_id,
      tbkUser: tbkUser?.substring(0, 10) + '...', // Solo mostrar parte del tbk_user por seguridad
      authorizationCode,
      amount: refundAmount,
      orderId: params.orderId,
    })

    // Obtener commerce_code de la tienda (necesario para reembolsos Mall)
    const storeCommerceCode = process.env.TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE || 
                              process.env.TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE || ''

    if (!storeCommerceCode) {
      throw new Error('Commerce code de tienda no configurado. Configura TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE o TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE')
    }

    // Para OneClick Mall, según la documentación de Transbank:
    // POST /rswebpaytransaction/api/oneclick/v1.2/transactions/{buy_order}/refunds
    // Body: { commerce_code: "...", detail_buy_order: "...", amount: ... }
    const refundResponse = await transbankClient.refundOneclickTransaction(
      mallBuyOrder, // buy_order del Mall en la URL
      detailBuyOrder, // detail_buy_order (store_buy_order) en el body
      storeCommerceCode, // commerce_code de la tienda en el body
      refundAmount
    )

    console.log('[createTransbankOneclickRefund] Reembolso creado:', {
      authorizationCode: refundResponse.authorization_code,
      nullifiedAmount: refundResponse.nullified_amount,
      balance: refundResponse.balance,
      responseCode: refundResponse.response_code,
      type: refundResponse.type,
    })

    // Validar que el reembolso fue exitoso
    if (refundResponse.response_code !== 0) {
      throw new Error(`Error en el reembolso de Transbank OneClick: código de respuesta ${refundResponse.response_code}`)
    }

    // El refund_id será el authorization_code del reembolso
    const refundId = refundResponse.authorization_code

    return {
      success: true,
      refundId,
      transactionId: refundResponse.authorization_code,
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

