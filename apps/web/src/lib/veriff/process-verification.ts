import { createServiceRoleClient } from '@/lib/supabase/server';

const VERIFF_BASE_URL = 'https://stationapi.veriff.com';

export interface ProcessVerificationResult {
  success: boolean;
  status?: string;
  error?: string;
  isNew?: boolean;
}

export async function processVeriffSession(
  veriffSessionId: string,
  config: {
    apiKey: string;
    apiSecret: string;
    organizationId: string;
    providerId: string;
    providerConfigId: string;
  },
  eventType?: string,
  webhookPayload?: any
): Promise<ProcessVerificationResult> {
  const adminClient = createServiceRoleClient();

  try {
    console.log(`🔄 Procesando sesión Veriff: ${veriffSessionId}`);

    // Verificar si ya existe
    const { data: existing } = await adminClient
      .from('identity_verification_sessions')
      .select('id, status')
      .eq('provider_session_id', veriffSessionId)
      .single();

    if (existing) {
      console.log(`⏭️ Session ${veriffSessionId} ya existe (status: ${existing.status})`);
      // Si ya existe, podríamos querer actualizarla si el estado cambió, 
      // pero por ahora mantenemos la lógica del cron de saltarla o marcarla como procesada.
      // Sin embargo, para webhooks de cambios de estado, deberíamos actualizar.
      // Por simplicidad y siguiendo el plan, permitiremos la actualización si es un evento nuevo.
      
      // NOTA: El cron original saltaba si existía. Aquí vamos a permitir actualizar 
      // para soportar múltiples webhooks del mismo session_id con diferentes estados.
    }

    // Consultar datos de Veriff
    const signature = await generateVeriffSignature(veriffSessionId, config.apiSecret);
    const [decisionData, personData, attemptsData, mediaData] = await Promise.all([
      fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/decision`, config.apiKey, signature),
      fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/person`, config.apiKey, signature),
      fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/attempts`, config.apiKey, signature),
      fetchVeriff(`${VERIFF_BASE_URL}/v1/sessions/${veriffSessionId}/media`, config.apiKey, signature),
    ]);

    if (!decisionData && !personData && !webhookPayload) {
      console.error(`❌ No se encontró data para ${veriffSessionId}`);
      return { success: false, error: 'No data found in Veriff' };
    }

    // Extraer datos del webhook si la API falló
    const webhookVerification = webhookPayload?.data?.verification;
    const webhookDecision = webhookVerification?.decision;

    // Extraer datos
    const person = personData?.person || personData || extractPersonFromWebhook(webhookVerification);
    const attemptsStatus = attemptsData?.verifications?.[0]?.status;
    const rawStatus = decisionData?.verification?.status || webhookDecision || attemptsStatus;
    const status = mapStatus(rawStatus);
    const riskScore = (decisionData?.verification?.riskLabels || webhookVerification?.riskLabels)
      ? Math.min((decisionData?.verification?.riskLabels || webhookVerification?.riskLabels).length * 20, 100)
      : null;
    
    // Documento desde API o Webhook
    const documentData = decisionData?.document || webhookVerification?.document;

    let sessionId = existing?.id;

    if (existing) {
      // Actualizar sesión existente
      const { error: updateError } = await adminClient
        .from('identity_verification_sessions')
        .update({
          status: status,
          decision_code: decisionData?.verification?.code?.toString() || webhookVerification?.code?.toString() || null,
          decision_reason: decisionData?.verification?.reason || webhookVerification?.reason || null,
          risk_score: riskScore,
          verified_at: decisionData?.verification?.acceptanceTime || webhookPayload?.acceptanceTime || null,
          raw_response: { 
            decision: decisionData, 
            person: personData,
            attempts: attemptsData,
            media: mediaData,
            webhook: webhookPayload
          },
          metadata: {
            last_synced_at: new Date().toISOString(),
            last_webhook_event: eventType,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`❌ Error actualizando ${veriffSessionId}:`, updateError);
        return { success: false, error: updateError.message };
      }
    } else {
      // Crear nueva sesión
      const { data: newSession, error: insertError } = await adminClient
        .from('identity_verification_sessions')
        .insert({
          organization_id: config.organizationId,
          provider_id: config.providerId,
          provider_config_id: config.providerConfigId,
          provider_session_id: veriffSessionId,
          purpose: 'general',
          subject_identifier: documentData?.number?.value || documentData?.number || person?.idCode || person?.idNumber || null,
          subject_email: person?.email || null,
          subject_name: person
            ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || null
            : null,
          status: status,
          decision_code: decisionData?.verification?.code?.toString() || webhookVerification?.code?.toString() || null,
          decision_reason: decisionData?.verification?.reason || webhookVerification?.reason || null,
          risk_score: riskScore,
          verified_at: decisionData?.verification?.acceptanceTime || webhookPayload?.acceptanceTime || null,
          raw_response: { 
            decision: decisionData, 
            person: personData,
            attempts: attemptsData,
            media: mediaData,
            webhook: webhookPayload
          },
          metadata: {
            auto_synced: true,
            synced_at: new Date().toISOString(),
            webhook_event: eventType,
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error insertando ${veriffSessionId}:`, insertError);
        return { success: false, error: insertError.message };
      }
      sessionId = newSession.id;
    }

    // Guardar documento
    if (documentData) {
      await saveDocument(adminClient, sessionId, documentData, person, decisionData?.verification || webhookVerification);
    } else if (person?.idCode || person?.idNumber) {
      await saveDocumentFromPerson(adminClient, sessionId, person);
    }

    // Guardar intentos
    if (attemptsData?.attempts?.length > 0) {
      await saveAttempts(adminClient, sessionId, attemptsData.attempts);
    } else if (attemptsData?.verifications?.length > 0) {
      // Formato alternativo de attempts
      await saveAttempts(adminClient, sessionId, attemptsData.verifications);
    }

    // Descargar media
    if (mediaData?.images?.length > 0) {
      await downloadMedia(
        adminClient,
        sessionId,
        config.organizationId,
        veriffSessionId,
        config.apiKey,
        config.apiSecret,
        signature
      );
    } else {
      // Fallback: descargar desde URLs sin firma (raw_response ya las tiene)
      const allMediaImages = mediaData?.images || [];
      if (allMediaImages.length > 0) {
        await downloadMediaDirect(adminClient, sessionId, config.organizationId, allMediaImages);
      }
    }

    return { success: true, status, isNew: !existing };

  } catch (error: any) {
    console.error(`❌ Error procesando sesión ${veriffSessionId}:`, error);
    return { success: false, error: error.message };
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

async function saveDocument(adminClient: any, sessionId: string, doc: any, person: any, verificationData: any) {
  try {
    // Verificar si ya existe documento para esta sesión para evitar duplicados/errores
    const { data: existingDoc } = await adminClient
        .from('identity_verification_documents')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1)
        .single();

    const docType = doc.type?.value || doc.type;
    const docCountry = doc.country?.value || doc.country;
    const docNumber = doc.number?.value || doc.number;
    const validUntil = doc.validUntil?.value || doc.validUntil;

    if (existingDoc) {
        // Podríamos actualizar, pero por ahora solo insertamos si no existe
        // O podríamos borrar y reinsertar. Vamos a hacer upsert o update.
        await adminClient.from('identity_verification_documents')
            .update({
                document_type: mapDocType(docType),
                document_country: docCountry,
                document_number: docNumber,
                first_name: person?.firstName,
                last_name: person?.lastName,
                date_of_birth: person?.dateOfBirth,
                expiry_date: validUntil,
                is_expired: validUntil ? new Date(validUntil) < new Date() : null,
                validation_checks: verificationData || {},
                confidence_score: verificationData?.code === 9001 ? 1.0 : 0.5,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingDoc.id);
    } else {
        await adminClient.from('identity_verification_documents').insert({
            session_id: sessionId,
            document_type: mapDocType(docType),
            document_country: docCountry,
            document_number: docNumber,
            first_name: person?.firstName,
            last_name: person?.lastName,
            date_of_birth: person?.dateOfBirth,
            expiry_date: validUntil,
            is_expired: validUntil ? new Date(validUntil) < new Date() : null,
            validation_checks: verificationData || {},
            confidence_score: verificationData?.code === 9001 ? 1.0 : 0.5,
        });
    }
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
    
    // Usar upsert para manejar intentos existentes
    await adminClient.from('identity_verification_attempts').upsert(
        attemptsData, 
        { onConflict: 'session_id, attempt_number' }
    );
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
        // Verificar si ya existe este media para no descargarlo de nuevo
        const { data: existingMedia } = await adminClient
            .from('identity_verification_media')
            .select('id')
            .eq('provider_media_id', img.id)
            .single();
            
        if (existingMedia) continue;

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

async function saveDocumentFromPerson(adminClient: any, sessionId: string, person: any) {
  try {
    // Verificar si ya existe documento
    const { data: existingDoc } = await adminClient
        .from('identity_verification_documents')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1)
        .single();

    if (existingDoc) return;

    await adminClient.from('identity_verification_documents').insert({
        session_id: sessionId,
        document_type: 'national_id', // Asumimos national_id si solo hay datos de persona
        document_country: person?.nationality?.value || person?.nationality,
        document_number: person?.idCode || person?.idNumber?.value || person?.idNumber,
        first_name: person?.firstName?.value || person?.firstName,
        last_name: person?.lastName?.value || person?.lastName,
        date_of_birth: person?.dateOfBirth?.value || person?.dateOfBirth,
        expiry_date: null,
        is_expired: null,
        validation_checks: {},
        confidence_score: 0.5,
    });
  } catch (e) {
    console.error('Error guardando documento desde persona:', e);
  }
}

async function downloadMediaDirect(
  adminClient: any,
  sessionId: string,
  orgId: string,
  images: any[]
) {
  try {
    for (const img of images) {
      try {
        // Verificar si ya existe este media
        const { data: existingMedia } = await adminClient
            .from('identity_verification_media')
            .select('id')
            .eq('provider_media_id', img.id)
            .single();
            
        if (existingMedia) continue;

        const dlRes = await fetch(img.url);
        if (!dlRes.ok) continue;
        const buffer = await (await dlRes.blob()).arrayBuffer();

        const mediaType = mapMediaType(img.context);
        const ext = img.mimetype === 'video/mp4' ? 'mp4' : 'jpg';
        const path = `${orgId}/${sessionId}/${mediaType}_${Date.now()}.${ext}`;

        await adminClient.storage.from('identity-verifications').upload(path, buffer, {
          contentType: img.mimetype || 'image/jpeg',
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
          mime_type: img.mimetype || 'image/jpeg',
          original_url: img.url,
          downloaded_at: new Date().toISOString(),
          checksum,
        });
      } catch (e) {
        console.error('Error descargando media directo:', e);
      }
    }
  } catch (e) {
    console.error('Error en downloadMediaDirect:', e);
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

function extractPersonFromWebhook(verification: any) {
  if (!verification?.person) return null;
  const p = verification.person;
  return {
    firstName: p.firstName?.value,
    lastName: p.lastName?.value,
    dateOfBirth: p.dateOfBirth?.value,
    gender: p.gender?.value,
    idNumber: p.idNumber?.value,
    nationality: p.nationality?.value,
    email: null // El webhook no suele traer email en el objeto person
  };
}
