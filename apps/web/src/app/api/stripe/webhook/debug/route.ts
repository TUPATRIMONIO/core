import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';

/**
 * Endpoint de debug para verificar estado de webhooks y créditos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
    }

    // Usar service role client para bypass RLS en debug
    const supabase = createServiceRoleClient();

    // Obtener Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Buscar payment en BD
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_payment_id', paymentIntentId)
      .eq('provider', 'stripe')
      .single();

    // Obtener organización
    const orgId = paymentIntent.metadata?.organization_id;
    let creditAccount = null;
    let creditTransactions = null;

    if (orgId) {
      // Obtener cuenta de créditos
      const { data: account } = await supabase
        .from('credit_accounts')
        .select('*')
        .eq('organization_id', orgId)
        .single();

      creditAccount = account;

      // Obtener transacciones recientes
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);

      creditTransactions = transactions;
    }

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
      payment: payment || null,
      paymentError: paymentError ? {
        message: paymentError.message,
        code: paymentError.code,
        details: paymentError.details,
      } : null,
      organization: {
        id: orgId || null,
        creditAccount: creditAccount || null,
        recentTransactions: creditTransactions || [],
      },
      debug: {
        hasOrgId: !!orgId,
        hasPayment: !!payment,
        hasCreditAccount: !!creditAccount,
        creditsAmount: paymentIntent.metadata?.credits_amount || null,
        type: paymentIntent.metadata?.type || null,
      },
    });
  } catch (error: any) {
    console.error('❌ Error en debug endpoint:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

