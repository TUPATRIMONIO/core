import { NextRequest, NextResponse } from 'next/server';
import { createTransbankPaymentForOrder } from '@/lib/transbank/checkout';
import { createClient } from '@/lib/supabase/server';
import { getOrder, canPayOrder } from '@/lib/checkout/core';

/**
 * POST /api/transbank/checkout/order
 * Crea un pago Transbank para una orden
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
    const { orderId, returnUrl } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }
    
    if (!returnUrl) {
      return NextResponse.json(
        { error: 'returnUrl es requerido' },
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
    
    // Crear pago Transbank
    const result = await createTransbankPaymentForOrder(orderId, returnUrl);
    
    return NextResponse.json({
      token: result.token,
      url: result.url,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('Error creando pago Transbank:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

