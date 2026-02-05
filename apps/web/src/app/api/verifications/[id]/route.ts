// =====================================================
// API Route: Get Verification Detail
// Description: Obtiene detalle completo de una verificación con media y documentos
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const sessionId = params.id;
    const adminClient = createServiceRoleClient();

    // Obtener sesión
    const { data: session, error: sessionError } = await adminClient
      .from('identity_verification_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    // Verificar acceso a la organización
    const { data: membership } = await adminClient
      .from('organization_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', session.organization_id)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
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
    console.error('Error en API verification detail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
