import { NextRequest, NextResponse } from 'next/server';
import { handleDLocalWebhook } from '@/lib/dlocal/webhooks';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // dLocal puede enviar eventos en diferentes formatos
    // Ajustar según la documentación oficial de dLocal Go
    const event = {
      id: body.id || body.event_id,
      type: body.type || body.event_type,
      payment: body.payment || body.data,
      signature: request.headers.get('x-dlocal-signature') || undefined,
    };
    
    await handleDLocalWebhook(event);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing dLocal webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing webhook' },
      { status: 400 }
    );
  }
}
