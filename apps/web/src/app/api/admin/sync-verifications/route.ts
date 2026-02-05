// =====================================================
// API Route: Import Veriff Verifications
// Description: Importa verificaciones de Veriff por ID de sesión
//              Llama directamente a la API de Veriff sin depender de Edge Functions
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

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
        .select('*, provider:identity_verification_providers(*)')
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
        .select('*, provider:identity_verification_providers(*)')
        .eq('is_active', true);

      config = configs?.find((c: any) => c.provider?.slug === 'veriff');
    }

    if (!config) {
      return NextResponse.json(
        { error: 'No se encontró configuración de Veriff. Verifica que exista un provider_config con credenciales en la base de datos.' },
        { status: 500 }
      );
    }

    if (!config.credentials?.api_key) {
      return NextResponse.json(
        { error: 'La configuración de Veriff no tiene api_key en credentials. Revisa la tabla identity_verification_provider_configs.' },
        { status: 500 }
      );
    }

    if (!config.credentials?.api_secret) {
      return NextResponse.json(
        { error: 'La configuración de Veriff no tiene api_secret. Es necesario para firmar las peticiones HMAC.' },
        { status: 500 }
      );
    }

    const apiKey = config.credentials.api_key;
    const apiSecret = config.credentials.api_secret;
    // Usar la org del usuario si se proporcionó, sino la de la config
    const finalOrgId = targetOrgId || config.organization_id;

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: any[] = [];

    for (const veriffSessionId of sessionIds) {
      try {
        // Verificar si ya existe en nuestra DB
        const { data: existing } = await adminClient
          .from('identity_verification_sessions')
          .select('id')
          .eq('provider_session_id', veriffSessionId)
          .single();

        if (existing) {
          skipped++;
          results.push({ id: veriffSessionId, status: 'skipped', reason: 'Ya existe en la base de datos' });
          continue;
        }

        // Obtener datos de la sesión desde Veriff (con firma SHA256)
        const signature = await generateVeriffSignature(veriffSessionId, apiSecret);
        const [decisionData, personData, attemptsData] = await Promise.all([
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`, apiKey, signature),
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`, apiKey, signature),
          fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`, apiKey, signature),
        ]);

        if (!decisionData && !personData) {
          errors++;
          results.push({
            id: veriffSessionId,
            status: 'error',
            reason: 'No se encontró información en Veriff. Verifica que el ID sea correcto.',
          });
          continue;
        }

        // Extraer datos de persona
        const person = personData?.person || personData;

        // Mapear status
        const status = mapStatus(
          decisionData?.verification?.status
        );

        // Calcular risk score
        let riskScore = null;
        if (decisionData?.verification?.riskLabels) {
          riskScore = Math.min(decisionData.verification.riskLabels.length * 20, 100);
        }

        // Crear sesión en nuestra DB
        const { data: newSession, error: insertError } = await adminClient
          .from('identity_verification_sessions')
          .insert({
            organization_id: finalOrgId,
            provider_id: config.provider_id || config.provider?.id,
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
            raw_response: { decision: decisionData, person: personData },
            metadata: {
              imported: true,
              imported_at: new Date().toISOString(),
              imported_by: user.id,
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error insertando sesión ${veriffSessionId}:`, insertError);
          errors++;
          results.push({ id: veriffSessionId, status: 'error', reason: insertError.message });
          continue;
        }

        // Guardar documento si existe
        if (decisionData?.document) {
          await saveDocument(adminClient, newSession.id, decisionData, person);
        }

        // Guardar intentos si existen
        const attempts = attemptsData?.attempts || [];
        if (attempts.length > 0) {
          await saveAttempts(adminClient, newSession.id, attempts);
        }

        // Descargar media
        await downloadMedia(adminClient, newSession.id, finalOrgId, veriffSessionId, apiKey, apiSecret, signature);

        imported++;
        results.push({
          id: veriffSessionId,
          status: 'imported',
          internalId: newSession.id,
          verificationStatus: status,
          subjectName: newSession.subject_name,
        });
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

// =====================================================
// HELPERS
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

    if (!response.ok) {
      console.error(`Veriff API error ${response.status} for ${url}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
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

async function saveDocument(adminClient: any, sessionId: string, decisionData: any, person: any) {
  try {
    const doc = decisionData.document;
    if (!doc) return;

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

async function saveAttempts(adminClient: any, sessionId: string, attempts: any[]) {
  try {
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      await adminClient.from('identity_verification_attempts').insert({
        session_id: sessionId,
        attempt_number: i + 1,
        provider_attempt_id: attempt.id || null,
        status: mapAttemptStatus(attempt.status),
        failure_reason: attempt.reason || null,
        raw_response: attempt,
        started_at: attempt.timestamp || new Date().toISOString(),
        completed_at: attempt.timestamp || null,
      });
    }
  } catch (e) {
    console.error('Error guardando intentos:', e);
  }
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

    if (!mediaData) return;

    const images = mediaData.images || [];

    for (const img of images) {
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

        // Calcular checksum
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
        console.error('Error descargando media individual:', e);
      }
    }
  } catch (e) {
    console.error('Error obteniendo media:', e);
  }
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

function mapDocType(t: string): string {
  const m: Record<string, string> = {
    ID_CARD: 'national_id',
    PASSPORT: 'passport',
    DRIVERS_LICENSE: 'drivers_license',
    RESIDENCE_PERMIT: 'residence_permit',
  };
  return m[t] || 'other';
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
