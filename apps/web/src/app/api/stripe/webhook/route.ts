import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook recibido en /api/stripe/webhook');
  
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');
  
  console.log('📝 Webhook details:', {
    hasSignature: !!signature,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    bodyLength: body.length,
  });
  
  if (!signature) {
    console.error('❌ No signature provided');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Webhook secret not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified:', {
      type: event.type,
      id: event.id,
    });
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }
  
  try {
    console.log('🔄 Processing webhook event:', event.type);
    await handleStripeWebhook(event);
    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

