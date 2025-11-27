import { NextRequest, NextResponse } from 'next/server';
import { handleTransbankWebhook } from '@/lib/transbank/webhooks';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, type } = body;
    
    if (!token) {
      return NextResponse.json(
        { error: 'token es requerido' },
        { status: 400 }
      );
    }
    
    if (!type || (type !== 'webpay_plus' && type !== 'oneclick')) {
      return NextResponse.json(
        { error: 'type debe ser webpay_plus o oneclick' },
        { status: 400 }
      );
    }
    
    const result = await handleTransbankWebhook(token, type);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error procesando webhook' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error procesando webhook de Transbank:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

