// =====================================================
// DEPRECATED: This function is no longer used.
// Webhooks are now handled by Next.js API route: /api/webhooks/veriff
// =====================================================

// =====================================================
// Edge Function: veriff-webhook
// Description: Procesa webhooks de Veriff para actualizar sesiones de verificación
// Created: 2026-02-04
// =====================================================

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFF_API_KEY = Deno.env.get("VERIFF_API_KEY") || "";
const VERIFF_API_SECRET = Deno.env.get("VERIFF_API_SECRET") || "";

interface VeriffWebhookPayload {
  id: string; // Session ID de Veriff
  feature: string;
  code: number;
  action: string;
  vendorData?: string;
}

interface VeriffDecision {
  verification: {
    id: string;
    code: number;
    reason: string;
    reasonCode: string;
    status: string;
    acceptanceTime?: string;
    decisionTime?: string;
    riskLabels?: string[];
  };
  person?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality?: string;
  };
  document?: {
    number: string;
    type: string;
    country: string;
    validFrom?: string;
    validUntil?: string;
  };
  technicalData?: {
    ip?: string;
  };
}

serve(async (req) => {
  // Solo aceptar POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Leer el payload
    const payload: VeriffWebhookPayload = await req.json();
    console.log("Webhook recibido:", payload);

    // Registrar en audit log
    await supabase.rpc("identity_verifications.log_audit_event", {
      p_event_type: "webhook_received",
      p_event_data: payload,
      p_actor_type: "webhook",
    });

    // Validar que tenemos el session ID de Veriff
    if (!payload.id) {
      throw new Error("Missing Veriff session ID");
    }

    // Buscar la sesión en nuestra base de datos
    const { data: session, error: sessionError } = await supabase
      .from("identity_verifications.verification_sessions")
      .select("*")
      .eq("provider_session_id", payload.id)
      .single();

    if (sessionError || !session) {
      console.error("Sesión no encontrada:", payload.id);
      
      // Aún así respondemos 200 para que Veriff no reintente
      return new Response(
        JSON.stringify({ 
          received: true, 
          warning: "Session not found in database" 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Procesar según el action
    switch (payload.action) {
      case "started":
        await handleStarted(supabase, session.id, payload);
        break;
      
      case "submitted":
        await handleSubmitted(supabase, session.id, payload);
        break;
      
      case "approved":
      case "declined":
      case "resubmission_requested":
      case "expired":
      case "abandoned":
        await handleDecision(supabase, session.id, payload);
        break;
      
      default:
        console.log("Action no manejado:", payload.action);
    }

    // Responder con éxito
    return new Response(
      JSON.stringify({ 
        received: true,
        sessionId: session.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error procesando webhook:", error);

    // Aún así respondemos 200 para evitar reintentos
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// =====================================================
// HANDLERS POR TIPO DE EVENTO
// =====================================================

async function handleStarted(
  supabase: any,
  sessionId: string,
  payload: VeriffWebhookPayload
) {
  console.log("Usuario inició verificación:", sessionId);

  await supabase.rpc("identity_verifications.update_session_status", {
    p_session_id: sessionId,
    p_status: "started",
  });

  await supabase.rpc("identity_verifications.log_audit_event", {
    p_session_id: sessionId,
    p_event_type: "verification_started",
    p_event_data: payload,
    p_actor_type: "user",
  });
}

async function handleSubmitted(
  supabase: any,
  sessionId: string,
  payload: VeriffWebhookPayload
) {
  console.log("Usuario completó verificación:", sessionId);

  await supabase.rpc("identity_verifications.update_session_status", {
    p_session_id: sessionId,
    p_status: "submitted",
  });

  await supabase.rpc("identity_verifications.log_audit_event", {
    p_session_id: sessionId,
    p_event_type: "verification_submitted",
    p_event_data: payload,
    p_actor_type: "user",
  });
}

async function handleDecision(
  supabase: any,
  sessionId: string,
  payload: VeriffWebhookPayload
) {
  console.log("Decisión recibida para sesión:", sessionId, "Action:", payload.action);

  // Obtener los datos completos de la decisión desde Veriff API
  const decision = await fetchVeriffDecision(payload.id);

  // Mapear el status de Veriff a nuestro enum
  const statusMap: Record<string, string> = {
    approved: "approved",
    declined: "declined",
    resubmission_requested: "resubmission_requested",
    expired: "expired",
    abandoned: "abandoned",
  };

  const ourStatus = statusMap[payload.action] || "declined";

  // Calcular risk score (simplificado)
  let riskScore = null;
  if (decision?.verification?.riskLabels) {
    riskScore = Math.min(decision.verification.riskLabels.length * 20, 100);
  }

  // Actualizar la sesión
  await supabase.rpc("identity_verifications.update_session_status", {
    p_session_id: sessionId,
    p_status: ourStatus,
    p_decision_code: decision?.verification?.code?.toString(),
    p_decision_reason: decision?.verification?.reason || payload.action,
    p_risk_score: riskScore,
    p_raw_response: decision,
  });

  // Si tenemos datos de documento, guardarlos
  if (decision?.document) {
    await saveDocument(supabase, sessionId, decision);
  }

  // Obtener y guardar intentos
  const attempts = await fetchVeriffAttempts(payload.id);
  if (attempts && attempts.length > 0) {
    await saveAttempts(supabase, sessionId, attempts);
  }

  // Descargar y guardar media
  if (ourStatus === "approved" || ourStatus === "declined") {
    await downloadAndSaveMedia(supabase, sessionId, payload.id);
  }

  // Registrar en audit log
  await supabase.rpc("identity_verifications.log_audit_event", {
    p_session_id: sessionId,
    p_event_type: "decision_received",
    p_event_data: {
      action: payload.action,
      code: payload.code,
      decision: decision?.verification,
    },
    p_actor_type: "webhook",
  });
}

// =====================================================
// HELPERS: API DE VERIFF
// =====================================================

async function fetchVeriffDecision(veriffSessionId: string): Promise<VeriffDecision | null> {
  try {
    const baseUrl = "https://stationapi.veriff.com";
    const url = `${baseUrl}/v1/sessions/${veriffSessionId}/decision`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-AUTH-CLIENT": VERIFF_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Error obteniendo decisión de Veriff:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en fetchVeriffDecision:", error);
    return null;
  }
}

async function downloadAndSaveMedia(
  supabase: any,
  sessionId: string,
  veriffSessionId: string
) {
  try {
    // Obtener la sesión para saber la org
    const { data: session } = await supabase
      .from("identity_verifications.verification_sessions")
      .select("organization_id")
      .eq("id", sessionId)
      .single();

    if (!session) return;

    // Obtener URLs de media de Veriff
    const mediaUrls = await fetchVeriffMedia(veriffSessionId);

    if (!mediaUrls || mediaUrls.length === 0) {
      console.log("No hay media disponible para descargar");
      return;
    }

    // Descargar y guardar cada archivo
    for (const mediaItem of mediaUrls) {
      await downloadAndStoreMedia(
        supabase,
        sessionId,
        session.organization_id,
        mediaItem
      );
    }

    console.log(`Media descargado y guardado para sesión ${sessionId}`);
  } catch (error) {
    console.error("Error descargando media:", error);
  }
}

async function fetchVeriffMedia(veriffSessionId: string): Promise<any[]> {
  try {
    const baseUrl = "https://stationapi.veriff.com";
    const url = `${baseUrl}/v1/sessions/${veriffSessionId}/media`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-AUTH-CLIENT": VERIFF_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Error obteniendo media de Veriff:", response.status);
      return [];
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error("Error en fetchVeriffMedia:", error);
    return [];
  }
}

async function fetchVeriffAttempts(veriffSessionId: string): Promise<any[]> {
  try {
    const baseUrl = "https://stationapi.veriff.com";
    const url = `${baseUrl}/v1/sessions/${veriffSessionId}/attempts`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-AUTH-CLIENT": VERIFF_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Error obteniendo attempts de Veriff:", response.status);
      return [];
    }

    const data = await response.json();
    return data.attempts || [];
  } catch (error) {
    console.error("Error en fetchVeriffAttempts:", error);
    return [];
  }
}

async function downloadAndStoreMedia(
  supabase: any,
  sessionId: string,
  organizationId: string,
  mediaItem: any
) {
  try {
    // Descargar el archivo
    const response = await fetch(mediaItem.url);
    if (!response.ok) return;

    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();

    // Determinar tipo de media
    const mediaType = mapVeriffMediaType(mediaItem.context);

    // Construir path
    const ext = getExtensionFromMimeType(mediaItem.mimeType || "image/jpeg");
    const storagePath = `${organizationId}/${sessionId}/${mediaType}_${Date.now()}.${ext}`;

    // Subir a Storage
    const { error: uploadError } = await supabase.storage
      .from("identity-verifications")
      .upload(storagePath, buffer, {
        contentType: mediaItem.mimeType || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo a storage:", uploadError);
      return;
    }

    // Calcular checksum
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Guardar registro en la tabla
    await supabase.from("identity_verifications.verification_media").insert({
      session_id: sessionId,
      media_type: mediaType,
      provider_media_id: mediaItem.id,
      storage_path: storagePath,
      original_url: mediaItem.url,
      file_size: buffer.byteLength,
      mime_type: mediaItem.mimeType || "image/jpeg",
      downloaded_at: new Date().toISOString(),
      checksum: checksum,
    });

    console.log(`Media guardado: ${storagePath}`);
  } catch (error) {
    console.error("Error en downloadAndStoreMedia:", error);
  }
}

async function saveDocument(
  supabase: any,
  sessionId: string,
  decision: VeriffDecision
) {
  try {
    const doc = decision.document;
    const person = decision.person;

    if (!doc) return;

    const docType = mapVeriffDocType(doc.type);

    await supabase.from("identity_verifications.verification_documents").insert({
      session_id: sessionId,
      document_type: docType,
      document_country: doc.country,
      document_number: doc.number,
      first_name: person?.firstName,
      last_name: person?.lastName,
      date_of_birth: person?.dateOfBirth,
      expiry_date: doc.validUntil,
      is_expired: doc.validUntil ? new Date(doc.validUntil) < new Date() : null,
      validation_checks: decision.verification,
      confidence_score: decision.verification?.code === 9001 ? 1.0 : 0.5,
    });

    console.log(`Documento guardado para sesión ${sessionId}`);
  } catch (error) {
    console.error("Error guardando documento:", error);
  }
}

async function saveAttempts(supabase: any, sessionId: string, attempts: any[]) {
  try {
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      
      // Verificar si ya existe para evitar duplicados
      const { data: existing } = await supabase
        .from("identity_verifications.verification_attempts")
        .select("id")
        .eq("session_id", sessionId)
        .eq("attempt_number", i + 1)
        .single();

      if (existing) continue;

      await supabase.from("identity_verifications.verification_attempts").insert({
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
    console.log(`${attempts.length} intento(s) guardado(s) para sesión ${sessionId}`);
  } catch (error) {
    console.error("Error guardando intentos:", error);
  }
}

function mapAttemptStatus(s: string): string {
  const m: Record<string, string> = {
    created: "pending", started: "in_progress", submitted: "completed",
    approved: "completed", declined: "failed", expired: "failed",
  };
  return m[s] || "pending";
}

// =====================================================
// HELPERS: MAPEO DE TIPOS
// =====================================================

function mapVeriffMediaType(context: string): string {
  const typeMap: Record<string, string> = {
    "document-front": "document_front",
    "document-back": "document_back",
    "face": "face_photo",
    "selfie": "selfie",
    "video": "liveness_video",
  };
  return typeMap[context] || "selfie";
}

function mapVeriffDocType(type: string): string {
  const typeMap: Record<string, string> = {
    "ID_CARD": "national_id",
    "PASSPORT": "passport",
    "DRIVERS_LICENSE": "drivers_license",
    "RESIDENCE_PERMIT": "residence_permit",
  };
  return typeMap[type] || "other";
}

function getExtensionFromMimeType(mimeType: string): string {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return extMap[mimeType] || "jpg";
}
