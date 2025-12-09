import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getStripeRefundStatus } from '@/lib/stripe/refunds'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/refunds/[id]
 * 
 * Obtiene los detalles de un reembolso específico
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createServiceRoleClient()

    // Obtener reembolso de la vista pública
    const { data: refund, error } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !refund) {
      return NextResponse.json(
        { error: 'Reembolso no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ refund })
  } catch (error: any) {
    console.error('Error obteniendo reembolso:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/refunds/[id]/sync
 * 
 * Sincroniza el estado del reembolso desde el proveedor (Stripe/Transbank)
 * Solo funciona para reembolsos con provider_refund_id
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = createServiceRoleClient()

    // Obtener reembolso
    const { data: refund, error: refundError } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (refundError || !refund) {
      return NextResponse.json(
        { error: 'Reembolso no encontrado' },
        { status: 404 }
      )
    }

    // Si no tiene provider_refund_id, no se puede sincronizar
    if (!refund.provider_refund_id) {
      return NextResponse.json(
        { error: 'Este reembolso no tiene ID de proveedor para sincronizar' },
        { status: 400 }
      )
    }

    let providerStatus: any = null
    let updatedStatus = refund.status

    // Sincronizar según el proveedor
    if (refund.provider === 'stripe') {
      const stripeRefund = await getStripeRefundStatus(refund.provider_refund_id)
      
      if (stripeRefund) {
        providerStatus = {
          id: stripeRefund.id,
          status: stripeRefund.status,
          amount: stripeRefund.amount,
          currency: stripeRefund.currency,
          reason: stripeRefund.reason,
          created: stripeRefund.created,
        }

        // Mapear estado de Stripe a nuestro estado
        // Stripe: succeeded, pending, failed, canceled
        if (stripeRefund.status === 'succeeded') {
          updatedStatus = 'completed'
        } else if (stripeRefund.status === 'pending') {
          updatedStatus = 'processing'
        } else if (stripeRefund.status === 'failed' || stripeRefund.status === 'canceled') {
          updatedStatus = 'rejected'
        }
      }
    } else if (refund.provider === 'transbank_webpay' || refund.provider === 'transbank_oneclick') {
      // Para Transbank, los reembolsos se procesan inmediatamente
      // Si tiene provider_refund_id, significa que fue exitoso
      // No hay API de consulta de estado de reembolso en Transbank
      providerStatus = {
        message: 'Transbank no proporciona API para consultar estado de reembolsos',
        note: 'Los reembolsos de Transbank se procesan inmediatamente',
      }
    }

    // Actualizar estado si cambió
    if (updatedStatus !== refund.status && providerStatus) {
      const { error: updateError } = await supabase
        .from('refund_requests')
        .update({
          status: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        console.error('Error actualizando estado del reembolso:', updateError)
      }
    }

    return NextResponse.json({
      refund: {
        ...refund,
        status: updatedStatus,
      },
      providerStatus,
      synced: true,
    })
  } catch (error: any) {
    console.error('Error sincronizando reembolso:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


