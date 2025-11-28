import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrder } from '@/lib/checkout/core';

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * GET /api/checkout/[orderId]/history
 * Obtiene el historial completo de eventos de una orden
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
    
    // Obtener orden para verificar permisos
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
    
    // Obtener historial completo de la orden
    const { data: history, error: historyError } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }); // Más antiguo primero
    
    if (historyError) {
      console.error('Error obteniendo historial:', historyError);
      return NextResponse.json(
        { error: 'Error obteniendo historial' },
        { status: 500 }
      );
    }
    
    // Enriquecer eventos con información adicional si es necesario
    const enrichedHistory = await Promise.all(
      (history || []).map(async (event) => {
        const enriched: any = { ...event };
        
        // Si hay user_id, obtener información del usuario
        if (event.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email, raw_user_meta_data')
            .eq('id', event.user_id)
            .single();
          
          if (userData) {
            enriched.user = {
              id: event.user_id,
              email: userData.email,
              name: userData.raw_user_meta_data?.name || userData.raw_user_meta_data?.full_name || null,
            };
          }
        }
        
        return enriched;
      })
    );
    
    return NextResponse.json({ 
      history: enrichedHistory,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
      }
    });
  } catch (error: any) {
    console.error('Error obteniendo historial de orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

