import { createServiceRoleClient } from '@/lib/supabase/server'

interface RefundToCreditsParams {
  orderId: string
  organizationId: string
  amount: number
  currency: string
  reason?: string
}

interface RefundToCreditsResult {
  success: boolean
  transactionId?: string
  error?: string
}

/**
 * Reembolsa un pedido agregando créditos al monedero de la organización
 * 
 * @param params - Parámetros del reembolso
 * @returns Resultado del reembolso
 */
export async function refundToCredits(
  params: RefundToCreditsParams
): Promise<RefundToCreditsResult> {
  const supabase = createServiceRoleClient()

  try {
    // Verificar que la orden existe
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, amount, currency, organization_id')
      .eq('id', params.orderId)
      .single()

    if (orderError || !order) {
      throw new Error(`Orden no encontrada: ${orderError?.message}`)
    }

    if (order.organization_id !== params.organizationId) {
      throw new Error('La organización no coincide con la orden')
    }

    // Convertir el monto a créditos
    // Por ahora, 1 unidad de moneda = 1 crédito
    // Esto puede ajustarse según la lógica de negocio
    const creditsAmount = Math.round(params.amount)

    console.log('[refundToCredits] Reembolsando a créditos:', {
      orderId: params.orderId,
      orderNumber: order.order_number,
      organizationId: params.organizationId,
      amount: params.amount,
      currency: params.currency,
      creditsAmount,
    })

    // Agregar créditos usando la función específica para reembolsos
    const { data: transactionId, error: refundError } = await supabase.rpc('add_refund_credits', {
      org_id: params.organizationId,
      amount: creditsAmount,
      order_id_param: params.orderId,
      metadata_param: {
        order_id: params.orderId,
        order_number: order.order_number,
        original_amount: params.amount,
        original_currency: params.currency,
        reason: params.reason,
      },
      description_param: params.reason 
        ? `Reembolso de pedido ${order.order_number}: ${params.reason}`
        : `Reembolso de pedido ${order.order_number}`,
    })

    if (refundError) {
      throw new Error(`Error agregando créditos: ${refundError.message}`)
    }

    console.log('[refundToCredits] Créditos agregados exitosamente:', {
      transactionId,
      creditsAmount,
      organizationId: params.organizationId,
    })

    return {
      success: true,
      transactionId,
    }
  } catch (error: any) {
    console.error('[refundToCredits] Error:', {
      orderId: params.orderId,
      organizationId: params.organizationId,
      error: error.message,
    })

    return {
      success: false,
      error: error.message || 'Error al reembolsar a créditos',
    }
  }
}

