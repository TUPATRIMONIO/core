import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Endpoint para obtener notificaciones del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    // Obtener notificaciones
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', orgId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Contar no leídas
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .eq('status', 'unread');

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

