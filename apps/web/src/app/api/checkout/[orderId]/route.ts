import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrder, updateOrderStatus, OrderStatus, canPayOrder } from '@/lib/checkout/core';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/checkout/[orderId]
 * Obtiene detalles de una orden
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
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
        { error: 'No tienes permiso para ver esta orden' },
        { status: 403 }
      );
    }
    
    // Verificar si puede pagar
    const canPay = canPayOrder(order);
    
    return NextResponse.json({
      ...order,
      canPay,
    });
  } catch (error: any) {
    console.error('Error obteniendo orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/checkout/[orderId]
 * Actualiza una orden (solo si está pendiente)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener orden actual
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
        { error: 'No tienes permiso para actualizar esta orden' },
        { status: 403 }
      );
    }
    
    // Solo se pueden actualizar órdenes pendientes
    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Solo se pueden actualizar órdenes pendientes de pago' },
        { status: 400 }
      );
    }
    
    // Parsear body
    const body = await request.json();
    const { status, invoiceId, paymentId } = body;
    
    // Validar status si se proporciona
    if (status) {
      const validStatuses: OrderStatus[] = [
        'pending_payment',
        'paid',
        'cancelled',
        'refunded',
        'completed',
      ];
      
      if (!validStatuses.includes(status as OrderStatus)) {
        return NextResponse.json(
          { error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    // Actualizar orden
    const updatedOrder = await updateOrderStatus(
      orderId,
      status || order.status,
      {
        invoiceId: invoiceId || order.invoice_id || undefined,
        paymentId: paymentId || order.payment_id || undefined,
      }
    );
    
    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Error actualizando orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

