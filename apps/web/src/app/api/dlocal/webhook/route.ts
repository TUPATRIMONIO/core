import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/provider-factory';

/**
 * Webhook para notificaciones de DLocal Go
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 [DLocal Webhook] Notificación recibida:', body);

    const dlocalProvider = getPaymentProvider('dlocalgo');
    const result = await dlocalProvider.processWebhook(body);

    if (!result.success) {
      console.error('❌ [DLocal Webhook] Error procesando notificación:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [DLocal Webhook] Error crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

