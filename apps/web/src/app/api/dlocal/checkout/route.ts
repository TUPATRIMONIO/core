import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDLocalPaymentForCredits } from '@/lib/dlocal/checkout';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { packageId, paymentMethodId } = body;
    
    if (!packageId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'packageId y paymentMethodId son requeridos' },
        { status: 400 }
      );
    }
    
    // Construir baseUrl de forma más robusta
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!baseUrl) {
      // Intentar obtener desde el header origin
      baseUrl = request.headers.get('origin') || '';
      
      // Si aún no hay baseUrl, construir desde request.url
      if (!baseUrl) {
        const url = new URL(request.url);
        baseUrl = `${url.protocol}//${url.host}`;
      }
    }
    
    // Validar que baseUrl sea una URL válida
    if (!baseUrl || (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://'))) {
      console.error('Invalid baseUrl:', baseUrl);
      return NextResponse.json(
        { error: 'Error de configuración: NEXT_PUBLIC_APP_URL no está configurado correctamente' },
        { status: 500 }
      );
    }
    
    const successUrl = `${baseUrl}/billing/purchase-credits/success?dlocal_payment_id={payment_id}`;
    const cancelUrl = `${baseUrl}/billing/purchase-credits/${packageId}`;
    
    const result = await createDLocalPaymentForCredits(
      orgUser.organization_id,
      packageId,
      paymentMethodId,
      successUrl,
      cancelUrl
    );
    
    return NextResponse.json({
      paymentId: result.payment.id,
      redirectUrl: result.redirectUrl,
      requiresRedirect: result.requiresRedirect,
      invoiceId: result.invoice.id,
    });
  } catch (error: any) {
    console.error('Error creando checkout dLocal:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

