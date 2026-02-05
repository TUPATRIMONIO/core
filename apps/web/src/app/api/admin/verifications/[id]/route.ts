// =====================================================
// API Route: Admin - Get Verification Detail
// Description: Detalle completo de una verificación (solo platform admins)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Solo platform admins pueden acceder' }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const adminClient = createServiceRoleClient();

    // Obtener sesión (sin filtrar por org)
    const { data: session, error: sessionError } = await adminClient
      .from('identity_verification_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // Obtener proveedor
    const { data: provider } = await adminClient
      .from('identity_verification_providers')
      .select('*')
      .eq('id', session.provider_id)
      .single();

    // Obtener intentos
    const { data: attempts } = await adminClient
      .from('identity_verification_attempts')
      .select('*')
      .eq('session_id', sessionId)
      .order('attempt_number', { ascending: true });

    // Obtener documentos
    const { data: documents } = await adminClient
      .from('identity_verification_documents')
      .select('*')
      .eq('session_id', sessionId);

    // Obtener media
    const { data: media } = await adminClient
      .from('identity_verification_media')
      .select('*')
      .eq('session_id', sessionId);

    return NextResponse.json({
      session,
      provider,
      attempts: attempts || [],
      documents: documents || [],
      media: media || [],
    });
  } catch (error: any) {
    console.error('Error en admin verification detail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
