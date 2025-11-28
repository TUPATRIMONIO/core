import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntentForOrder } from '@/lib/stripe/checkout';
import { createClient } from '@/lib/supabase/server';
import { getOrder, canPayOrder } from '@/lib/checkout/core';

/**
 * POST /api/stripe/checkout/order
 * Crea un Payment Intent de Stripe para una orden
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Parsear body
    const body = await request.json();
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener orden
    const order = await getOrder(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar que el usuario pertenece a la organización de la orden
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', order.organization_id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'No tienes permiso para pagar esta orden' },
        { status: 403 }
      );
    }
    
    // Verificar que la orden puede ser pagada
    if (!canPayOrder(order)) {
      return NextResponse.json(
        { error: 'La orden no puede ser pagada (expirada o no pendiente)' },
        { status: 400 }
      );
    }
    
    // Obtener URL base desde los headers de la request
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    console.log('🌐 [Stripe Checkout] URL base detectada:', {
      host,
      protocol,
      baseUrl,
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
      },
    });
    
    // Crear Checkout Session
    const result = await createPaymentIntentForOrder(orderId, baseUrl);
    
    if (!result.url) {
      return NextResponse.json(
        { error: 'No se pudo crear la sesión de checkout' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      url: result.url,
      sessionId: result.checkoutSession.id,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('Error creando Payment Intent:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

