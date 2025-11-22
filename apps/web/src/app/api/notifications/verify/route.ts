import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Calcula estadísticas de notificaciones
 */
function calculateStats(notifications: any[]) {
  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => n.status === 'unread').length,
    read: notifications.filter(n => n.status === 'read').length,
    byType: {} as Record<string, number>,
  };

  notifications.forEach(n => {
    stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
  });

  return stats;
}

/**
 * Endpoint de verificación para ver notificaciones (solo para testing)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Obtener todas las notificaciones de la organización usando schema core directamente
    const { data: notifications, error } = await supabase
      .schema('core')
      .from('notifications')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      throw error;
    }

    // Contar por tipo y estado
    const stats = calculateStats(notifications || []);

    return NextResponse.json({
      notifications: notifications || [],
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

