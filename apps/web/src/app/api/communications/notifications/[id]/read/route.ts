/**
 * API Route: Marcar Notificación como Leída
 * 
 * POST: Marcar una notificación como leída
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que la notificación pertenezca al usuario
    const { data: notification } = await supabase
      .from('user_notifications')
      .select('id, read_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!notification) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    // Si ya está leída, no hacer nada
    if (notification.read_at) {
      return NextResponse.json({ success: true, data: notification });
    }

    // Marcar como leída
    const { data, error } = await supabase
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al marcar notificación como leída:', error);
    return NextResponse.json(
      { error: error.message || 'Error al marcar notificación como leída' },
      { status: 500 }
    );
  }
}

