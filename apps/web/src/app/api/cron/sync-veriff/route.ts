// =====================================================
// API Route: Cron - Sync Veriff Verifications
// Description: Procesa verificaciones pendientes de la cola (ejecutado diariamente)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const VERIFF_BASE_URL = 'https://stationapi.veriff.com';
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

    const apiKey = config.credentials.api_key;
    const apiSecret = config.credentials.api_secret;

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

        // Verificar si ya existe
        const { data: existing } = await adminClient
          .from('identity_verification_sessions')
          .select('id')
          .eq('provider_session_id', veriffSessionId)
          .single();

        if (existing) {
          console.log(`⏭️ Session ${veriffSessionId} ya existe, marcando como procesada`);
          await adminClient
            .from('pending_veriff_syncs')
            .update({ 
              status: 'processed',
              processed_at: new Date().toISOString(),
            })
            .eq('id', sync.id);
          skipped++;
          continue;
        }

        // Consultar datos de Veriff
        const signature = await generateVeriffSignature(veriffSessionId, apiSecret);
        const [decisionData, personData, attemptsData, mediaData] = await Promise.all([
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`, apiKey, signature),
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`, apiKey, signature),
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`, apiKey, signature),
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/media`, apiKey, signature),
        ]);

        if (!decisionData && !personData) {
          console.error(`❌ No se encontró data para ${veriffSessionId}`);
          await adminClient
            .from('pending_veriff_syncs')
            .update({ 
              status: 'failed',
              error_message: 'No data found in Veriff',
              retry_count: sync.retry_count + 1,
            })
            .eq('id', sync.id);
          failed++;
          continue;
        }

        // Extraer datos
        const person = personData?.person || personData;
        const status = mapStatus(decisionData?.verification?.status);
        const riskScore = decisionData?.verification?.riskLabels
          ? Math.min(decisionData.verification.riskLabels.length * 20, 100)
          : null;

        // Crear sesión
        const { data: newSession, error: insertError } = await adminClient
          .from('identity_verification_sessions')
          .insert({
            organization_id: config.organization_id,
            provider_id: config.provider_id,
            provider_config_id: config.id,
            provider_session_id: veriffSessionId,
            purpose: 'general',
            subject_identifier: decisionData?.document?.number || null,
            subject_email: person?.email || null,
            subject_name: person
              ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || null
              : null,
            status: status,
            decision_code: decisionData?.verification?.code?.toString() || null,
            decision_reason: decisionData?.verification?.reason || null,
            risk_score: riskScore,
            verified_at: decisionData?.verification?.acceptanceTime || null,
            raw_response: { 
              decision: decisionData, 
              person: personData,
              attempts: attemptsData,
              media: mediaData,
            },
            metadata: {
              auto_synced: true,
              synced_at: new Date().toISOString(),
              webhook_event: sync.event_type,
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error(`❌ Error insertando ${veriffSessionId}:`, insertError);
          await adminClient
            .from('pending_veriff_syncs')
            .update({ 
              status: 'failed',
              error_message: insertError.message,
              retry_count: sync.retry_count + 1,
            })
            .eq('id', sync.id);
          failed++;
          continue;
        }

        // Guardar documento
        if (decisionData?.document) {
          await saveDocument(adminClient, newSession.id, decisionData, person);
        }

        // Guardar intentos
        if (attemptsData?.attempts?.length > 0) {
          await saveAttempts(adminClient, newSession.id, attemptsData.attempts);
        }

        // Descargar media
        if (mediaData?.images?.length > 0) {
          await downloadMedia(
            adminClient,
            newSession.id,
            config.organization_id,
            veriffSessionId,
            apiKey,
            apiSecret,
            signature
          );
        }

        // Marcar como procesado
        await adminClient
          .from('pending_veriff_syncs')
          .update({ 
            status: 'processed',
            processed_at: new Date().toISOString(),
          })
          .eq('id', sync.id);

        console.log(`✅ Procesada: ${veriffSessionId} (${status})`);
        processed++;

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

// =====================================================
// HELPERS (reutilizados de sync-verifications)
// =====================================================

async function fetchVeriff(url: string, apiKey: string, signature: string): Promise<any> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-AUTH-CLIENT': apiKey,
        'X-SIGNATURE': signature,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function generateVeriffSignature(sessionId: string, apiSecret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(sessionId + apiSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function mapStatus(s: string | undefined): string {
  if (!s) return 'pending';
  const m: Record<string, string> = {
    created: 'pending',
    started: 'started',
    submitted: 'submitted',
    approved: 'approved',
    declined: 'declined',
    expired: 'expired',
    abandoned: 'abandoned',
    resubmission_requested: 'resubmission_requested',
  };
  return m[s] || 'pending';
}

async function saveDocument(adminClient: any, sessionId: string, decisionData: any, person: any) {
  try {
    const doc = decisionData.document;
    await adminClient.from('identity_verification_documents').insert({
      session_id: sessionId,
      document_type: mapDocType(doc.type),
      document_country: doc.country,
      document_number: doc.number,
      first_name: person?.firstName,
      last_name: person?.lastName,
      date_of_birth: person?.dateOfBirth,
      expiry_date: doc.validUntil,
      is_expired: doc.validUntil ? new Date(doc.validUntil) < new Date() : null,
      validation_checks: decisionData.verification || {},
      confidence_score: decisionData.verification?.code === 9001 ? 1.0 : 0.5,
    });
  } catch (e) {
    console.error('Error guardando documento:', e);
  }
}

function mapDocType(t: string): string {
  const m: Record<string, string> = {
    ID_CARD: 'national_id',
    PASSPORT: 'passport',
    DRIVERS_LICENSE: 'drivers_license',
    RESIDENCE_PERMIT: 'residence_permit',
  };
  return m[t] || 'other';
}

async function saveAttempts(adminClient: any, sessionId: string, attempts: any[]) {
  try {
    const attemptsData = attempts.map((attempt, idx) => ({
      session_id: sessionId,
      attempt_number: idx + 1,
      provider_attempt_id: attempt.id || null,
      status: mapAttemptStatus(attempt.status),
      failure_reason: attempt.reason || null,
      raw_response: attempt,
      started_at: attempt.timestamp || new Date().toISOString(),
      completed_at: attempt.timestamp || null,
    }));
    await adminClient.from('identity_verification_attempts').insert(attemptsData);
  } catch (e) {
    console.error('Error guardando intentos:', e);
  }
}

function mapAttemptStatus(s: string): string {
  const m: Record<string, string> = {
    created: 'pending',
    started: 'in_progress',
    submitted: 'completed',
    approved: 'completed',
    declined: 'failed',
    expired: 'failed',
  };
  return m[s] || 'pending';
}

async function downloadMedia(
  adminClient: any,
  sessionId: string,
  orgId: string,
  veriffId: string,
  apiKey: string,
  apiSecret: string,
  signature: string
) {
  try {
    const mediaData = await fetchVeriff(
      `${VERIFF_BASE_URL}/v1/sessions/${veriffId}/media`,
      apiKey,
      signature
    );

    if (!mediaData?.images) return;

    for (const img of mediaData.images) {
      try {
        const dlRes = await fetch(img.url);
        if (!dlRes.ok) continue;
        const buffer = await (await dlRes.blob()).arrayBuffer();

        const mediaType = mapMediaType(img.context);
        const ext = img.mimeType === 'video/mp4' ? 'mp4' : 'jpg';
        const path = `${orgId}/${sessionId}/${mediaType}_${Date.now()}.${ext}`;

        await adminClient.storage.from('identity-verifications').upload(path, buffer, {
          contentType: img.mimeType || 'image/jpeg',
        });

        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const checksum = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

        await adminClient.from('identity_verification_media').insert({
          session_id: sessionId,
          media_type: mediaType,
          provider_media_id: img.id,
          storage_path: path,
          file_size: buffer.byteLength,
          mime_type: img.mimeType || 'image/jpeg',
          downloaded_at: new Date().toISOString(),
          checksum,
        });
      } catch (e) {
        console.error('Error descargando media:', e);
      }
    }
  } catch (e) {
    console.error('Error en downloadMedia:', e);
  }
}

function mapMediaType(c: string): string {
  const m: Record<string, string> = {
    'document-front': 'document_front',
    'document-back': 'document_back',
    face: 'face_photo',
    selfie: 'selfie',
    video: 'liveness_video',
  };
  return m[c] || 'selfie';
}
