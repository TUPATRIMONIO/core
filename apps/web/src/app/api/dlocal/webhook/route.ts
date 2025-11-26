import { NextRequest, NextResponse } from 'next/server';
import { handleDLocalWebhook } from '@/lib/dlocal/webhooks';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('📥 [dLocal Webhook Route] Webhook recibido en /api/dlocal/webhook');
    console.log('📝 [dLocal Webhook Route] Headers:', JSON.stringify(headers, null, 2));
    console.log('📝 [dLocal Webhook Route] Body recibido:', JSON.stringify(body, null, 2));
    
    // dLocal Go envía notificaciones POST directamente al notification_url
    // El formato puede variar, así que pasamos el body completo para que el handler lo procese
    await handleDLocalWebhook(body);
    
    console.log('✅ [dLocal Webhook Route] Webhook procesado exitosamente');
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ [dLocal Webhook Route] Error processing dLocal webhook:', {
      error: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: error.message || 'Error processing webhook' },
      { status: 400 }
    );
  }
}
