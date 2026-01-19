import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrder } from '@/lib/checkout/core';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { code, orderId } = body || {};

    if (!code || !orderId) {
      return NextResponse.json(
        { error: 'code y orderId son requeridos' },
        { status: 400 }
      );
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', order.organization_id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'No tienes permiso para aplicar este descuento' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase.rpc('validate_discount_code', {
      p_code: code,
      p_order_id: orderId,
    });

    if (error) {
      console.error('[Discounts] Error validando código:', error);
      return NextResponse.json(
        { error: 'No se pudo validar el código' },
        { status: 500 }
      );
    }

    if (!data?.success) {
      return NextResponse.json(
        { error: data?.error || 'Código no válido' },
        { status: 400 }
      );
    }

    const updatedMetadata = {
      ...(order.metadata || {}),
      discount_code: {
        code: data.code,
        type: data.type,
        value: data.value,
      },
    };

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        discount_code_id: data.discount_code_id,
        discount_amount: data.discount_amount,
        original_amount: data.original_amount,
        amount: data.final_amount,
        metadata: updatedMetadata,
      })
      .eq('id', orderId)
      .select('id, amount, original_amount, discount_amount, discount_code_id, metadata')
      .single();

    if (updateError || !updatedOrder) {
      console.error('[Discounts] Error actualizando orden:', updateError);
      return NextResponse.json(
        { error: 'No se pudo aplicar el descuento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      discount: {
        code: data.code,
        type: data.type,
        value: data.value,
        original_amount: data.original_amount,
        discount_amount: data.discount_amount,
        final_amount: data.final_amount,
      },
    });
  } catch (error: any) {
    console.error('[Discounts] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error inesperado al validar el código' },
      { status: 500 }
    );
  }
}

