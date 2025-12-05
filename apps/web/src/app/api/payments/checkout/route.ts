import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOrder, canPayOrder } from '@/lib/checkout/core';
import { getPaymentProvider } from '@/lib/payments/provider-factory';

/**
 * POST /api/payments/checkout
 * 
 * API unificada para crear sesiones de pago con cualquier proveedor
 * 
 * Body:
 * - orderId: string (requerido)
 * - provider: 'stripe' | 'transbank' (requerido)
 * - returnUrl: string (opcional, se construye automáticamente si no se proporciona)
 * 
 * Retorna:
 * - url: string - URL a la que redirigir al usuario
 * - sessionId: string - ID de la sesión en el proveedor
 * - provider: string - Nombre del proveedor usado
 * - orderId: string - ID de la orden
 * - orderNumber: string - Número de orden
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
    const { orderId, provider, returnUrl, document_type, billing_data } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId es requerido' },
        { status: 400 }
      );
    }
    
    if (!provider) {
      return NextResponse.json(
        { error: 'provider es requerido (stripe, transbank, etc.)' },
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

    // Guardar datos de facturación en metadata de la orden para ambos proveedores
    if (billing_data) {
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
        console.error('[Checkout] Error actualizando metadata de orden:', updateError);
        // No fallar el flujo, solo loguear el error
      }

      // También guardar los datos de facturación en la configuración de la organización
      // para que se usen como valores predeterminados en futuras compras
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

        console.log('[Checkout] Datos de facturación guardados como predeterminados');
      } catch (settingsError) {
        console.error('[Checkout] Error guardando datos de facturación predeterminados:', settingsError);
        // No fallar el flujo
      }
    }
    
    // Obtener proveedor de pago
    let paymentProvider;
    try {
      paymentProvider = getPaymentProvider(provider);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Proveedor de pago no válido' },
        { status: 400 }
      );
    }
    
    // Construir returnUrl si no se proporciona
    let finalReturnUrl = returnUrl;
    if (!finalReturnUrl) {
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      finalReturnUrl = `${baseUrl}/checkout/${orderId}/success?provider=${provider}`;
    }
    
    console.log('💳 [Unified Checkout] Creando sesión de pago:', {
      provider,
      orderId,
      orderNumber: order.order_number,
      returnUrl: finalReturnUrl,
    });
    
    // Crear sesión de pago usando el proveedor
    const session = await paymentProvider.createPaymentSession({
      orderId,
      returnUrl: finalReturnUrl,
      organizationId: order.organization_id,
      amount: order.amount,
      currency: order.currency,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        product_type: order.product_type,
        ...(document_type && { document_type }),
        ...(billing_data && { billing_data }),
      },
    });
    
    return NextResponse.json({
      url: session.url,
      sessionId: session.sessionId,
      provider: session.provider,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error: any) {
    console.error('💳 [Unified Checkout] Error creando sesión de pago:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

