import { NextRequest, NextResponse } from 'next/server';
import { handleDLocalWebhook } from '@/lib/dlocal/webhooks';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Webhook dLocal Go recibido en /api/dlocal/webhook');
    console.log('📝 Body recibido:', JSON.stringify(body, null, 2));
    
    // dLocal Go envía notificaciones POST directamente al notification_url
    // El formato puede variar, así que pasamos el body completo para que el handler lo procese
    await handleDLocalWebhook(body);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error processing dLocal webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing webhook' },
      { status: 400 }
    );
  }
}
