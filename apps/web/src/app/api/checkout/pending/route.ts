import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPendingOrders } from '@/lib/checkout/core';

/**
 * GET /api/checkout/pending
 * Obtiene órdenes pendientes del usuario autenticado
 */
export async function GET(request: NextRequest) {
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
    
    // Obtener organización activa del usuario
    const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: user.id
    });
    
    if (!activeOrg || activeOrg.length === 0) {
      return NextResponse.json({
        orders: [],
      });
    }
    
    const orgId = activeOrg[0].organization_id;
    
    // Obtener órdenes pendientes
    const orders = await getPendingOrders(orgId);
    
    return NextResponse.json({
      orders,
    });
  } catch (error: any) {
    console.error('Error obteniendo órdenes pendientes:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

