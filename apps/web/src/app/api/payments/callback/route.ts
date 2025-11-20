import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')

    if (!paymentId || !status) {
      return NextResponse.redirect(new URL('/dashboard/credits?error=invalid_callback', request.url))
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .schema('core')
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.redirect(new URL('/dashboard/credits?error=payment_not_found', request.url))
    }

    // If already processed, redirect
    if (payment.status === 'completed') {
      return NextResponse.redirect(new URL('/dashboard/credits?success=already_processed', request.url))
    }

    if (status === 'success' || status === 'completed') {
      // Update payment status
      await supabase
        .schema('core')
        .from('payments')
        .update({
          status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('id', paymentId)

      // Add credits to organization
      const metadata = payment.metadata as { package_id?: string; credits?: number; bonus_credits?: number }
      const totalCredits = (metadata.credits || 0) + (metadata.bonus_credits || 0)

      if (totalCredits > 0) {
        const { error: creditsError } = await supabase.rpc('add_credits', {
          p_org_id: payment.organization_id,
          p_amount: totalCredits,
          p_type: 'purchase',
          p_description: `Compra de paquete de créditos`,
          p_reference_type: 'payment',
          p_reference_id: paymentId,
        })

        if (creditsError) {
          console.error('Error adding credits:', creditsError)
          return NextResponse.redirect(
            new URL('/dashboard/credits?error=credits_failed', request.url)
          )
        }
      }

      return NextResponse.redirect(new URL('/dashboard/credits?success=purchase_completed', request.url))
    } else {
      // Payment failed
      await supabase
        .schema('core')
        .from('payments')
        .update({
          status: 'failed',
        })
        .eq('id', paymentId)

      return NextResponse.redirect(new URL('/dashboard/credits?error=payment_failed', request.url))
    }
  } catch (error) {
    console.error('Error in payment callback:', error)
    return NextResponse.redirect(new URL('/dashboard/credits?error=callback_error', request.url))
  }
}

