import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrderByNumber } from '@/lib/checkout/core';

/**
 * POST /api/checkout/recover
 * Recupera una orden por número (para emails de seguimiento)
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
    const { orderNumber } = body;
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'orderNumber es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener orden por número
    const order = await getOrderByNumber(orderNumber);
    
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
        { error: 'No tienes permiso para ver esta orden' },
        { status: 403 }
      );
    }
    
    // Construir URL de checkout
    const checkoutUrl = `/checkout/${order.id}`;
    
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      checkoutUrl,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      expiresAt: order.expires_at,
    });
  } catch (error: any) {
    console.error('Error recuperando orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

