import { NextRequest, NextResponse } from 'next/server';
import { getPaymentProvider } from '@/lib/payments/provider-factory';

/**
 * Webhook para notificaciones de Flow.cl
 * Documentación: https://developers.flow.cl/api#notificaciones-de-flow-a-su-comercio
 */
export async function POST(request: NextRequest) {
  try {
    // Flow envía parámetros por application/x-www-form-urlencoded
    const formData = await request.formData();
    const token = formData.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    console.log('🔔 [Flow Webhook] Notificación recibida:', { token });

    const flowProvider = getPaymentProvider('flow');
    const result = await flowProvider.processWebhook({ token });

    if (!result.success) {
      console.error('❌ [Flow Webhook] Error procesando notificación:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Flow requiere una respuesta exitosa para dejar de enviar notificaciones
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [Flow Webhook] Error crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

