import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOneclickPaymentForOrder } from '@/lib/transbank/checkout';
import { getOrder, canPayOrder } from '@/lib/checkout/core';

/**
 * POST /api/transbank/oneclick/payment/order
 * Crea un pago Oneclick para una orden
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
    const { orderId, tbkUser, username, document_type, billing_data } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }
    
    if (!tbkUser) {
      return NextResponse.json(
        { error: 'tbkUser es requerido' },
        { status: 400 }
      );
    }
    
    if (!username) {
      return NextResponse.json(
        { error: 'username es requerido' },
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

    // Guardar datos de facturación en metadata de la orden si se proporcionan
    if (document_type || billing_data) {
      const { createServiceRoleClient } = await import('@/lib/supabase/server');
      const serviceSupabase = createServiceRoleClient();
      
      const updatedMetadata = {
        ...(order.metadata || {}),
        ...(document_type && { document_type }),
        ...(billing_data && { billing_data }),
      };

      const { error: updateError } = await serviceSupabase
        .from('orders')
        .update({ metadata: updatedMetadata })
        .eq('id', orderId);

      if (updateError) {
        console.error('[Oneclick Payment] Error actualizando metadata de orden:', updateError);
        // No fallar el flujo, solo loguear el error
      }

      // También guardar los datos de facturación en la configuración de la organización
      // para que se usen como valores predeterminados en futuras compras
      if (billing_data) {
        try {
          const { data: org } = await serviceSupabase
            .from('organizations')
            .select('settings')
            .eq('id', order.organization_id)
            .single();

          const currentSettings = (org?.settings as any) || {};
          const savedBillingData = {
            ...billing_data,
            ...(document_type && { document_type }),
          };

          const updatedSettings = {
            ...currentSettings,
            billing_data: savedBillingData,
          };

          await serviceSupabase
            .from('organizations')
            .update({ settings: updatedSettings })
            .eq('id', order.organization_id);

          console.log('[Oneclick Payment] Datos de facturación guardados como predeterminados');
        } catch (settingsError) {
          console.error('[Oneclick Payment] Error guardando datos de facturación predeterminados:', settingsError);
          // No fallar el flujo
        }
      }
    }
    
    // Crear pago Oneclick (autoriza directamente)
    const result = await createOneclickPaymentForOrder(orderId, tbkUser, username);
    
    return NextResponse.json({
      success: result.success, // Basado en si fue autorizado o no
      token: result.token,
      url: result.url, // Vacío porque el pago ya está autorizado
      orderId: order.id,
      orderNumber: order.order_number,
      invoiceId: result.invoice?.id || null,
      paymentStatus: result.payment?.status, // Estado del pago (authorized/rejected)
    });
  } catch (error: any) {
    console.error('Error creando pago Oneclick para orden:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

