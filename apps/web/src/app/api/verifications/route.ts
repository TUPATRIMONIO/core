// =====================================================
// API Route: List Verifications
// Description: Obtiene las verificaciones de identidad de la organización activa
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const purpose = searchParams.get('purpose');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId requerido' }, { status: 400 });
    }

    // Usar service_role para consultar directamente
    const adminClient = createServiceRoleClient();

    // Verificar que el usuario pertenece a la organización
    const { data: membership, error: memberError } = await adminClient
      .from('organization_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    console.log('Membership check:', { userId: user.id, organizationId, membership, error: memberError?.message });

    if (!membership) {
      return NextResponse.json({ 
        error: 'No tienes acceso a esta organización',
        debug: { userId: user.id, organizationId, dbError: memberError?.message }
      }, { status: 403 });
    }

    // Consultar verificaciones
    let query = adminClient
      .from('identity_verification_sessions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (purpose && purpose !== 'all') {
      query = query.eq('purpose', purpose);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error consultando verificaciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error en API verifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

