// =====================================================
// API Route: Admin - List All Verifications
// Description: Lista TODAS las verificaciones (solo platform admins)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const purpose = searchParams.get('purpose');

    const adminClient = createServiceRoleClient();

    let query = adminClient
      .from('identity_verification_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

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
    console.error('Error en admin verifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
