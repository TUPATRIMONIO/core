import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { notifyCreditsAdded, notifyPaymentSucceeded, notifyAutoRechargeExecuted } from '@/lib/notifications/billing';

export const runtime = 'nodejs';

/**
 * Endpoint de prueba para crear notificaciones
 */
export async function POST(request: NextRequest) {
  try {
    const { type, orgId, userId } = await request.json();

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Obtener organización para verificar que existe
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    let notificationId: string;

    switch (type) {
      case 'credits_added':
        notificationId = await notifyCreditsAdded(orgId, 500, 'credit_purchase', undefined);
        break;
      
      case 'payment_succeeded':
        notificationId = await notifyPaymentSucceeded(orgId, 9.99, 'USD', 'test-invoice-id');
        break;
      
      case 'auto_recharge_executed':
        notificationId = await notifyAutoRechargeExecuted(orgId, 9.99, 500);
        break;
      
      default:
        // Crear notificación genérica
        const { data, error } = await supabase.rpc('create_notification', {
          org_id_param: orgId,
          notification_type_param: 'general',
          title_param: 'Notificación de prueba',
          message_param: 'Esta es una notificación de prueba creada manualmente.',
          user_id_param: userId || null,
          action_url_param: '/billing',
          action_label_param: 'Ver facturación',
          metadata_param: { test: true },
        });

        if (error) throw error;
        notificationId = data;
    }

    return NextResponse.json({
      success: true,
      notificationId,
      message: `Notificación de tipo '${type}' creada exitosamente`,
    });
  } catch (error: any) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

