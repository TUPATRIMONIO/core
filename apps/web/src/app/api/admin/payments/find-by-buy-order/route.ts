import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buyOrder = searchParams.get('buy_order')
    const storeBuyOrder = searchParams.get('store_buy_order')

    if (!buyOrder && !storeBuyOrder) {
      return NextResponse.json(
        { error: 'buy_order o store_buy_order es requerido' },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    // Buscar pago por buy_order o store_buy_order
    let payment = null
    let error = null

    if (storeBuyOrder) {
      // Buscar por store_buy_order (OneClick Mall)
      const { data, error: err } = await supabase
        .from('payments')
        .select('*, order:orders(id, order_number, status, amount, currency)')
        .eq('provider', 'transbank')
        .eq('metadata->>store_buy_order', storeBuyOrder)
        .maybeSingle()
      
      payment = data
      error = err
    }

    if (!payment && buyOrder) {
      // Buscar por buy_order (puede ser Webpay Plus o OneClick Mall)
      const { data, error: err } = await supabase
        .from('payments')
        .select('*, order:orders(id, order_number, status, amount, currency)')
        .eq('provider', 'transbank')
        .or(`metadata->>buy_order.eq.${buyOrder},metadata->>store_buy_order.eq.${buyOrder}`)
        .maybeSingle()
      
      payment = data
      error = err
    }

    if (error) {
      console.error('Error buscando pago:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        provider_payment_id: payment.provider_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        metadata: payment.metadata,
      },
      order: payment.order,
      orderId: payment.metadata?.order_id || null,
    })
  } catch (error: any) {
    console.error('Error buscando pago por buy_order:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}



