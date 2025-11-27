import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/checkout/[orderId]/cancel
 * Cancela una orden pendiente
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener la orden para verificar permisos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, organization:organizations!inner(id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario pertenece a la organización
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', order.organization_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar esta orden' },
        { status: 403 }
      );
    }

    // Verificar que la orden esté en estado pending_payment
    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar órdenes pendientes' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la orden a 'cancelled'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { error: 'Error cancelando orden' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Orden cancelada correctamente',
    });
  } catch (error) {
    console.error('Error in POST /api/checkout/[orderId]/cancel:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

