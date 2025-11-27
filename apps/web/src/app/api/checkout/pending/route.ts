import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/checkout/pending
 * Obtiene las órdenes pendientes del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
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

    // Obtener membresías del usuario
    const { data: memberships, error: membershipsError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (membershipsError) {
      console.error('Error fetching memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Error obteniendo membresías' },
        { status: 500 }
      );
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const organizationIds = memberships.map((m) => m.organization_id);

    // Obtener órdenes pendientes de las organizaciones del usuario
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('organization_id', organizationIds)
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Error obteniendo órdenes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (error) {
    console.error('Error in GET /api/checkout/pending:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
