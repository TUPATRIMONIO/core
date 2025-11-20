import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { packageId, currency, paymentMethod, organizationId } = body

    if (!packageId || !currency || !paymentMethod || !organizationId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    // Verify organization membership
    const { data: membership } = await supabase
      .schema('core')
      .from('organization_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      )
    }

    // Get package and price
    const { data: pkg } = await supabase
      .schema('core')
      .from('credit_packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (!pkg) {
      return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
    }

    const { data: price } = await supabase
      .schema('core')
      .from('credit_package_prices')
      .select('*')
      .eq('package_id', packageId)
      .eq('currency', currency)
      .single()

    if (!price) {
      return NextResponse.json(
        { error: 'Precio no disponible para esta moneda' },
        { status: 404 }
      )
    }

    // Get payment provider
    const { data: provider } = await supabase
      .schema('core')
      .from('payment_providers')
      .select('id')
      .eq('slug', paymentMethod)
      .eq('is_active', true)
      .single()

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor de pago no encontrado' },
        { status: 404 }
      )
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .schema('core')
      .from('payments')
      .insert({
        organization_id: organizationId,
        provider_id: provider.id,
        amount: price.price,
        currency: currency,
        status: 'pending',
        payment_type: 'credit_package',
        reference_id: packageId,
        paid_by: user.id,
        metadata: {
          package_id: packageId,
          credits: pkg.credits,
          bonus_credits: pkg.bonus_credits,
        },
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json(
        { error: 'Error al crear el pago' },
        { status: 500 }
      )
    }

    // Create checkout session based on payment method
    let checkoutUrl: string

    if (paymentMethod === 'stripe') {
      // TODO: Integrate with Stripe
      // For now, return a placeholder
      checkoutUrl = `/api/payments/callback?payment_id=${payment.id}&status=success&provider=stripe`
    } else if (paymentMethod === 'dlocalgo') {
      // TODO: Integrate with DLocalGo
      // For now, return a placeholder
      checkoutUrl = `/api/payments/callback?payment_id=${payment.id}&status=success&provider=dlocalgo`
    } else {
      return NextResponse.json(
        { error: 'Método de pago no soportado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Error in create-checkout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

