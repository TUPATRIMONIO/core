// =====================================================
// API Route: Admin - Lookup Verification
// Description: Busca una verificación por ID de sesión de Veriff.
//              Si no existe en BD local, intenta importarla desde Veriff.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { processVeriffSession } from '@/lib/veriff/process-verification';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verificar autenticación y rol de admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Solo platform admins pueden acceder' }, { status: 403 });
    }

    // 2. Obtener parámetros
    const body = await request.json();
    const { veriffSessionId } = body;

    if (!veriffSessionId) {
      return NextResponse.json({ error: 'veriffSessionId requerido' }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();

    // 3. Buscar en BD local
    const { data: existingSession } = await adminClient
      .from('identity_verification_sessions')
      .select('id')
      .eq('provider_session_id', veriffSessionId)
      .single();

    if (existingSession) {
      return NextResponse.json({
        found: true,
        source: 'local',
        sessionId: existingSession.id,
        message: 'Verificación encontrada en base de datos local'
      });
    }

    // 4. Si no existe, intentar importar desde Veriff
    // Necesitamos la configuración activa
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('id, provider_id, credentials, organization_id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config?.credentials?.api_key || !config?.credentials?.api_secret) {
      return NextResponse.json({ 
        found: false, 
        error: 'No se encontró configuración activa de Veriff para importar' 
      }, { status: 500 });
    }

    console.log(`🔍 Buscando sesión ${veriffSessionId} en Veriff...`);

    const result = await processVeriffSession(
      veriffSessionId,
      {
        apiKey: config.credentials.api_key,
        apiSecret: config.credentials.api_secret,
        organizationId: config.organization_id,
        providerId: config.provider_id,
        providerConfigId: config.id,
      },
      'admin_lookup'
    );

    if (result.success) {
      // Buscar el ID recién creado
      const { data: newSession } = await adminClient
        .from('identity_verification_sessions')
        .select('id')
        .eq('provider_session_id', veriffSessionId)
        .single();

      if (newSession) {
        return NextResponse.json({
          found: true,
          source: 'veriff',
          sessionId: newSession.id,
          message: 'Verificación importada exitosamente desde Veriff'
        });
      }
    }

    return NextResponse.json({
      found: false,
      error: result.error || 'No se encontró la verificación en Veriff'
    });

  } catch (error: any) {
    console.error('Error en lookup verification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
