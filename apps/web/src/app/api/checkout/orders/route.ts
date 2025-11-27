import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/lib/checkout/core';

/**
 * GET /api/checkout/orders
 * Obtiene todas las órdenes del usuario actual con filtro opcional por estado
 * Query params: ?status=pending_payment|paid|completed|cancelled|refunded
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

    // Obtener parámetro de estado de la query string
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') as OrderStatus | null;

    // Construir query base
    // Obtener órdenes primero, luego obtener invoices y payments por separado si existen
    let query = supabase
      .from('orders')
      .select('*')
      .in('organization_id', organizationIds);

    // Aplicar filtro por estado si se proporciona
    if (statusParam && ['pending_payment', 'paid', 'completed', 'cancelled', 'refunded'].includes(statusParam)) {
      query = query.eq('status', statusParam);
    }

    // Ordenar por fecha de creación descendente
    const { data: orders, error: ordersError } = await query.order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Error obteniendo órdenes' },
        { status: 500 }
      );
    }

    // Enriquecer órdenes con información de invoices y payments si existen
    const enrichedOrders = await Promise.all(
      (orders || []).map(async (order) => {
        const enriched: any = { ...order };

        // Obtener invoice si existe
        if (order.invoice_id) {
          const { data: invoice } = await supabase
            .from('invoices')
            .select('id, invoice_number, total, currency, type')
            .eq('id', order.invoice_id)
            .single();
          
          if (invoice) {
            enriched.invoice = invoice;
          }
        }

        // Obtener payment si existe
        if (order.payment_id) {
          const { data: payment } = await supabase
            .from('payments')
            .select('id, status, provider, amount, currency')
            .eq('id', order.payment_id)
            .single();
          
          if (payment) {
            enriched.payment = payment;
          }
        }

        return enriched;
      })
    );

    return NextResponse.json({ orders: enrichedOrders });
  } catch (error) {
    console.error('Error in GET /api/checkout/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

