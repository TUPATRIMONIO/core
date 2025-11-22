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
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '';
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

