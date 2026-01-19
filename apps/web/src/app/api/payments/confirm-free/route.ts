import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getOrder, updateOrderStatus } from '@/lib/checkout/core';
import { recordDiscountUsage } from '@/lib/discounts/usage';

/**
 * POST /api/payments/confirm-free
 * 
 * Confirma un pedido gratuito (100% descuento) sin pasar por medios de pago
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
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
    
    // Verificar que el usuario pertenece a la organización
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', order.organization_id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'No tienes permiso para confirmar esta orden' },
        { status: 403 }
      );
    }
    
    // Verificar que la orden está pendiente
    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'La orden no está pendiente de pago' },
        { status: 400 }
      );
    }
    
    // Verificar que el monto es $0 (después del descuento)
    if (Number(order.amount) > 0) {
      return NextResponse.json(
        { error: 'Esta orden requiere pago. El monto no es $0.' },
        { status: 400 }
      );
    }
    
    // Registrar uso del descuento si hay uno aplicado
    if (order.discount_code_id) {
      await recordDiscountUsage(orderId, serviceSupabase);
    }
    
    // Marcar orden como pagada (sin pago real)
    await updateOrderStatus(orderId, 'paid', {
      supabaseClient: serviceSupabase,
      userId: user.id,
    });
    
    // Marcar como completada inmediatamente para pedidos gratuitos
    await updateOrderStatus(orderId, 'completed', {
      supabaseClient: serviceSupabase,
      userId: user.id,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Pedido confirmado exitosamente',
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('[confirm-free] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error confirmando pedido' },
      { status: 500 }
    );
  }
}
