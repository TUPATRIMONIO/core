// =====================================================
// API Route: Import Veriff Verifications
// Description: Importa verificaciones de Veriff por ID de sesión
//              Llama directamente a la API de Veriff sin depender de Edge Functions
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { processVeriffSession } from '@/lib/veriff/process-verification';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds, organizationId } = body;

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: 'sessionIds requerido (array de IDs de sesión de Veriff)' },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();

    // Determinar organización destino
    const targetOrgId = organizationId;

    if (targetOrgId) {
      // Verificar que el usuario tenga acceso a la organización
      const { data: membership } = await adminClient
        .from('organization_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', targetOrgId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta organización' },
          { status: 403 }
        );
      }
    }

    // Obtener configuración de Veriff desde la base de datos
    // Primero buscar config de la org del usuario, luego fallback a cualquier config activa
    let config: any = null;

    if (targetOrgId) {
      const { data: orgConfig } = await adminClient
        .from('identity_verification_provider_configs')
        .select('id, provider_id, credentials, organization_id, provider:identity_verification_providers(*)')
        .eq('organization_id', targetOrgId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (orgConfig?.provider?.slug === 'veriff') {
        config = orgConfig;
      }
    }

    // Fallback: buscar cualquier config de Veriff activa (modelo centralizado)
    if (!config) {
      const { data: configs } = await adminClient
        .from('identity_verification_provider_configs')
        .select('id, provider_id, credentials, organization_id, provider:identity_verification_providers(*)')
        .eq('is_active', true);

      config = configs?.find((c: any) => c.provider?.slug === 'veriff');
    }

    if (!config) {
      return NextResponse.json(
        { error: 'No se encontró configuración de Veriff. Verifica que exista un provider_config con credenciales en la base de datos.' },
        { status: 500 }
      );
    }

    if (!config.credentials?.api_key || !config.credentials?.api_secret) {
      return NextResponse.json(
        { error: 'La configuración de Veriff no tiene credenciales válidas.' },
        { status: 500 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: any[] = [];

    for (const veriffSessionId of sessionIds) {
      try {
        // Usar la función compartida processVeriffSession
        const result = await processVeriffSession(
          veriffSessionId,
          {
            apiKey: config.credentials.api_key,
            apiSecret: config.credentials.api_secret,
            organizationId: targetOrgId || config.organization_id,
            providerId: config.provider_id || config.provider?.id,
            providerConfigId: config.id,
          },
          'manual_import'
        );

        if (result.success) {
          if (result.isNew) {
            imported++;
            results.push({ 
              id: veriffSessionId, 
              status: 'imported', 
              verificationStatus: result.status 
            });
          } else {
            // Si ya existía y se actualizó, lo contamos como importado o skipped según criterio
            // Aquí lo contaremos como skipped para mantener compatibilidad con frontend
            skipped++;
            results.push({ 
              id: veriffSessionId, 
              status: 'skipped', 
              reason: 'Ya existe (actualizado)' 
            });
          }
        } else {
          errors++;
          results.push({ 
            id: veriffSessionId, 
            status: 'error', 
            reason: result.error 
          });
        }

      } catch (error: any) {
        console.error(`Error procesando ${veriffSessionId}:`, error);
        errors++;
        results.push({ id: veriffSessionId, status: 'error', reason: error.message });
      }

      // Delay entre sesiones para respetar rate limits
      if (sessionIds.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Registrar en audit log
    await adminClient.from('identity_verification_audit_log').insert({
      event_type: 'bulk_import',
      event_data: {
        imported,
        skipped,
        errors,
        total: sessionIds.length,
        imported_by: user.id,
      },
      actor_type: 'user',
      actor_id: user.id,
    });

    return NextResponse.json({ success: true, imported, skipped, errors, results });
  } catch (error: any) {
    console.error('Error en sync-verifications:', error);
    return NextResponse.json(
      { error: 'Error interno', details: error.message },
      { status: 500 }
    );
  }
}
