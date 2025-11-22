import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';
import { stripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';

/**
 * Endpoint de prueba para procesar un Payment Intent específico
 * Útil para testing cuando el listener de webhooks no está disponible
 */
export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'paymentIntentId is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Test endpoint: Procesando Payment Intent:', paymentIntentId);

    // Obtener el Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment Intent status is ${paymentIntent.status}, expected succeeded` },
        { status: 400 }
      );
    }

    // Crear un evento simulado
    const mockEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      api_version: '2023-10-16',
      created: Math.floor(Date.now() / 1000),
      livemode: false,
      pending_webhooks: 0,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: 'payment_intent.succeeded',
      data: {
        object: paymentIntent,
      },
    } as any;

    // Procesar el evento
    await handleStripeWebhook(mockEvent);

    return NextResponse.json({
      success: true,
      message: 'Payment Intent procesado exitosamente',
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('❌ Error en test endpoint:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

