// =====================================================
// API Route: Cron - Sync Veriff Verifications
// Description: Procesa verificaciones pendientes de la cola (ejecutado diariamente)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { processVeriffSession } from '@/lib/veriff/process-verification';

const BATCH_SIZE = 50; // Procesar máximo 50 por ejecución

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron (Vercel envía header especial)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('Intento no autorizado de ejecutar cron sync-veriff');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Iniciando sincronización automática de Veriff...');

    const adminClient = createServiceRoleClient();

    // Obtener configuración de Veriff
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('id, provider_id, credentials, organization_id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!config?.credentials?.api_key || !config?.credentials?.api_secret) {
      console.error('No se encontró configuración activa de Veriff');
      return NextResponse.json({ error: 'Veriff not configured' }, { status: 500 });
    }

    // Obtener sesiones pendientes de sincronización
    const { data: pendingSync, error: fetchError } = await adminClient
      .from('pending_veriff_syncs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error('Error obteniendo pendientes:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingSync || pendingSync.length === 0) {
      console.log('✅ No hay verificaciones pendientes de sincronizar');
      return NextResponse.json({ message: 'No pending syncs', processed: 0 });
    }

    console.log(`📋 Procesando ${pendingSync.length} verificaciones...`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;

    for (const sync of pendingSync) {
      try {
        const veriffSessionId = sync.veriff_session_id;

        // Marcar como procesando
        await adminClient
          .from('pending_veriff_syncs')
          .update({ status: 'processing' })
          .eq('id', sync.id);

        const result = await processVeriffSession(
          veriffSessionId,
          {
            apiKey: config.credentials.api_key,
            apiSecret: config.credentials.api_secret,
            organizationId: config.organization_id,
            providerId: config.provider_id,
            providerConfigId: config.id,
          },
          sync.event_type
        );

        if (result.success) {
          // Marcar como procesado
          await adminClient
            .from('pending_veriff_syncs')
            .update({ 
              status: 'processed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', sync.id);

          console.log(`✅ Procesada: ${veriffSessionId} (status: ${result.status})`);
          processed++;
        } else {
          console.error(`❌ Falló procesamiento de ${veriffSessionId}: ${result.error}`);
          await adminClient
            .from('pending_veriff_syncs')
            .update({ 
              status: 'failed',
              error_message: result.error,
              retry_count: sync.retry_count + 1,
            })
            .eq('id', sync.id);
          failed++;
        }

        // Delay para rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error: any) {
        console.error(`❌ Error procesando sync ${sync.id}:`, error);
        await adminClient
          .from('pending_veriff_syncs')
          .update({ 
            status: 'failed',
            error_message: error.message,
            retry_count: sync.retry_count + 1,
          })
          .eq('id', sync.id);
        failed++;
      }
    }

    console.log(`🎉 Sincronización completada: ${processed} procesadas, ${skipped} saltadas, ${failed} fallidas`);

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      failed,
      total: pendingSync.length,
    });
  } catch (error: any) {
    console.error('❌ Error en cron sync-veriff:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
