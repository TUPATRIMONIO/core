/**
 * API Route: Notificaciones de Usuario
 * 
 * GET: Obtener notificaciones del usuario
 * POST: Crear notificación (usado internamente)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir query
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contar no leídas
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    return NextResponse.json({
      data: data || [],
      unread_count: unreadCount || 0,
    });
  } catch (error: any) {
    console.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, organization_id, type, title, message, link } = body;

    // Validaciones
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'user_id, type, title y message son campos requeridos' },
        { status: 400 }
      );
    }

    // Solo puedes crear notificaciones para ti mismo o si eres admin
    if (user_id !== user.id) {
      // Verificar si es admin de la organización
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('role:roles(level)')
        .eq('user_id', user.id)
        .eq('organization_id', organization_id)
        .eq('status', 'active')
        .single();

      const roleLevel = (orgUser?.role as any)?.level || 0;
      if (roleLevel < 7) {
        return NextResponse.json(
          { error: 'No tienes permisos para crear notificaciones para otros usuarios' },
          { status: 403 }
        );
      }
    }

    // Crear notificación
    const { data, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id,
        organization_id: organization_id || null,
        type,
        title,
        message,
        link: link || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al crear notificación:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear notificación' },
      { status: 500 }
    );
  }
}

