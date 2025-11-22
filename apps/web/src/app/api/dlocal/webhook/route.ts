import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/dlocal/client';
import { createClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = (await headers()).get('x-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }
    
    const { id, status, amount, currency, payment_method_id, country } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Verificar firma
    if (!verifyWebhookSignature(signature, id)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const supabase = await createClient();
    
    // Buscar pago en BD
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_payment_id', id)
      .eq('provider', 'dlocal')
      .single();
    
    if (!payment) {
      console.warn('Payment not found in database:', id);
      return NextResponse.json({ received: true }); // Acknowledge anyway
    }
    
    // Actualizar estado del pago
    let paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' = 'pending';
    
    switch (status) {
      case 'PAID':
        paymentStatus = 'succeeded';
        break;
      case 'FAILED':
      case 'REJECTED':
        paymentStatus = 'failed';
        break;
      case 'CANCELLED':
        paymentStatus = 'failed';
        break;
      case 'PENDING':
        paymentStatus = 'processing';
        break;
    }
    
    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        processed_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
        failure_reason: paymentStatus === 'failed' ? `dLocal status: ${status}` : null,
        metadata: {
          ...payment.metadata,
          dlocal_status: status,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', payment.id);
    
    // Si el pago fue exitoso y es compra de créditos, agregar créditos
    if (paymentStatus === 'succeeded' && payment.metadata?.type === 'credit_purchase') {
      const creditsAmount = parseFloat(payment.metadata.credits_amount || '0');
      if (creditsAmount > 0) {
        await addCredits(payment.organization_id, creditsAmount, 'credit_purchase', {
          payment_id: payment.id,
          dlocal_payment_id: id,
        });
      }
    }
    
    // Actualizar factura si existe
    if (payment.invoice_id) {
      await supabase
        .from('invoices')
        .update({
          status: paymentStatus === 'succeeded' ? 'paid' : 'open',
          paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
        })
        .eq('id', payment.invoice_id);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling dLocal webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

