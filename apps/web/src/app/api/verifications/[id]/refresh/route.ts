// =====================================================
// API Route: Refresh Verification from Veriff
// Description: Consulta la API de Veriff on-demand y actualiza datos locales
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: sessionId } = await params;
    const adminClient = createServiceRoleClient();

    // Obtener sesión local
    const { data: session, error: sessionError } = await adminClient
      .from('identity_verification_sessions')
      .select('*, organization_id')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (!session.provider_session_id) {
      return NextResponse.json(
        { error: 'Esta sesión no tiene un provider_session_id de Veriff' },
        { status: 400 }
      );
    }

    // Verificar acceso: platform admin O miembro de la organización
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin');

    if (!isPlatformAdmin) {
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
    }

    // Obtener configuración de Veriff
    const { data: config } = await adminClient
      .from('identity_verification_provider_configs')
      .select('credentials')
      .eq('provider_id', session.provider_id)
      .eq('is_active', true)
      .single();

    if (!config || !config.credentials?.api_key || !config.credentials?.api_secret) {
      return NextResponse.json(
        { error: 'No se encontró configuración completa de Veriff (api_key + api_secret)' },
        { status: 500 }
      );
    }

    const apiKey = config.credentials.api_key;
    const apiSecret = config.credentials.api_secret;
    const veriffSessionId = session.provider_session_id;

    // Generar firma SHA256(sessionId + apiSecret)
    const signature = await generateVeriffSignature(veriffSessionId, apiSecret);

    // Consultar los 3 endpoints de Veriff Station API
    const [personData, attemptsData, decisionData] = await Promise.all([
      fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`, apiKey, signature),
      fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`, apiKey, signature),
      fetchVeriffEndpoint(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`, apiKey, signature),
    ]);

    let updatedFields = 0;

    // Actualizar sesión si hay datos
    if (decisionData || personData) {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        raw_response: { ...session.raw_response },
      };

      if (decisionData?.verification) {
        const statusMap: Record<string, string> = {
          approved: 'approved',
          declined: 'declined',
          resubmission_requested: 'resubmission_requested',
          expired: 'expired',
          abandoned: 'abandoned',
        };
        
        updateData.status = statusMap[decisionData.verification.status] || session.status;
        updateData.decision_code = decisionData.verification.code?.toString();
        updateData.decision_reason = decisionData.verification.reason;
        
        if (decisionData.verification.riskLabels) {
          updateData.risk_score = Math.min(decisionData.verification.riskLabels.length * 20, 100);
        }
        
        updateData.verified_at = decisionData.verification.acceptanceTime || null;
        updateData.raw_response.decision = decisionData;
      }

      if (personData) {
        const person = personData.person || personData;
        updateData.subject_name = person.firstName && person.lastName
          ? `${person.firstName} ${person.lastName}`.trim()
          : session.subject_name;
        updateData.subject_email = person.email || session.subject_email;
        updateData.raw_response.person = personData;
      }

      if (attemptsData) {
        updateData.raw_response.attempts = attemptsData;
      }

      const { error: updateError } = await adminClient
        .from('identity_verification_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (!updateError) updatedFields++;
    }

    // Actualizar/crear documento si hay datos
    if (decisionData?.document) {
      const doc = decisionData.document;
      const person = decisionData.person || personData?.person || personData;

      // Verificar si ya existe
      const { data: existingDoc } = await adminClient
        .from('identity_verification_documents')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      const docData = {
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
      };

      if (existingDoc) {
        await adminClient
          .from('identity_verification_documents')
          .update(docData)
          .eq('id', existingDoc.id);
      } else {
        await adminClient.from('identity_verification_documents').insert(docData);
      }
      updatedFields++;
    }

    // Actualizar/crear intentos si hay datos
    if (attemptsData?.attempts && attemptsData.attempts.length > 0) {
      for (let i = 0; i < attemptsData.attempts.length; i++) {
        const attempt = attemptsData.attempts[i];

        // Verificar si ya existe
        const { data: existing } = await adminClient
          .from('identity_verification_attempts')
          .select('id')
          .eq('session_id', sessionId)
          .eq('attempt_number', i + 1)
          .single();

        const attemptData = {
          session_id: sessionId,
          attempt_number: i + 1,
          provider_attempt_id: attempt.id || null,
          status: mapAttemptStatus(attempt.status),
          failure_reason: attempt.reason || null,
          raw_response: attempt,
          started_at: attempt.timestamp || new Date().toISOString(),
          completed_at: attempt.timestamp || null,
        };

        if (existing) {
          await adminClient
            .from('identity_verification_attempts')
            .update(attemptData)
            .eq('id', existing.id);
        } else {
          await adminClient.from('identity_verification_attempts').insert(attemptData);
        }
      }
      updatedFields++;
    }

    // Registrar en audit log
    await adminClient.from('identity_verification_audit_log').insert({
      session_id: sessionId,
      event_type: 'data_refreshed',
      event_data: {
        user_id: user.id,
        refreshed_at: new Date().toISOString(),
        fields_updated: updatedFields,
      },
      actor_type: 'user',
      actor_id: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Datos actualizados desde Veriff',
      updated_fields: updatedFields,
      data: {
        person: personData !== null,
        attempts: attemptsData?.attempts?.length || 0,
        decision: decisionData !== null,
      },
    });
  } catch (error: any) {
    console.error('Error en refresh:', error);
    return NextResponse.json(
      { error: 'Error al refrescar datos', details: error.message },
      { status: 500 }
    );
  }
}

// =====================================================
// HELPERS
// =====================================================

async function fetchVeriffEndpoint(url: string, apiKey: string, signature: string): Promise<any> {
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
      console.error(`Error fetching ${url}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error en fetchVeriffEndpoint ${url}:`, error);
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

function mapDocType(type: string): string {
  const map: Record<string, string> = {
    ID_CARD: 'national_id',
    PASSPORT: 'passport',
    DRIVERS_LICENSE: 'drivers_license',
    RESIDENCE_PERMIT: 'residence_permit',
  };
  return map[type] || 'other';
}

function mapAttemptStatus(status: string): string {
  const map: Record<string, string> = {
    created: 'pending',
    started: 'in_progress',
    submitted: 'completed',
    approved: 'completed',
    declined: 'failed',
    expired: 'failed',
  };
  return map[status] || 'pending';
}
