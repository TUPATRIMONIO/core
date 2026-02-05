// =====================================================
// Edge Function: veriff-sync
// Description: Importa sesiones específicas de Veriff por ID
//              Veriff no tiene endpoint de listado, solo por ID individual
// Created: 2026-02-05
// =====================================================

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VERIFF_API_KEY = Deno.env.get("VERIFF_API_KEY")!;

interface ImportRequest {
  sessionIds: string[];
  organizationId?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body: ImportRequest = await req.json();
    const { sessionIds, organizationId } = body;

    if (!sessionIds || sessionIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "sessionIds requerido (array de IDs de Veriff)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔄 Importando ${sessionIds.length} sesión(es) de Veriff...`);

    // Obtener configuración de Veriff
    const { data: configs } = await supabase
      .from("identity_verification_provider_configs")
      .select("*, provider:identity_verification_providers(*)")
      .eq("is_active", true);

    const config = configs?.find((c: any) => c.provider?.slug === "veriff");

    if (!config) {
      throw new Error("No se encontró configuración de Veriff");
    }

    // Determinar organización destino
    const targetOrgId = organizationId || config.organization_id;

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const results: any[] = [];

    for (const veriffSessionId of sessionIds) {
      try {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from("identity_verification_sessions")
          .select("id")
          .eq("provider_session_id", veriffSessionId)
          .single();

        if (existing) {
          skipped++;
          results.push({ id: veriffSessionId, status: "skipped", reason: "Ya existe" });
          continue;
        }

        // Obtener datos de la sesión
        const sessionData = await fetchSessionData(veriffSessionId);
        if (!sessionData) {
          errors++;
          results.push({ id: veriffSessionId, status: "error", reason: "No se encontró en Veriff" });
          continue;
        }

        // Obtener decisión
        const decision = await fetchDecision(veriffSessionId);

        // Obtener persona
        const person = await fetchPerson(veriffSessionId);

        // Obtener intentos
        const attempts = await fetchAttempts(veriffSessionId);

        // Mapear status
        const status = mapStatus(sessionData.status || decision?.verification?.status);

        // Crear sesión en nuestra DB
        const { data: newSession, error: insertError } = await supabase
          .from("identity_verification_sessions")
          .insert({
            organization_id: targetOrgId,
            provider_id: config.provider_id || config.provider?.id,
            provider_config_id: config.id,
            provider_session_id: veriffSessionId,
            purpose: "general",
            subject_identifier: decision?.document?.number || null,
            subject_email: person?.email || null,
            subject_name: person
              ? `${person.firstName || ""} ${person.lastName || ""}`.trim()
              : null,
            status: status,
            decision_code: decision?.verification?.code?.toString(),
            decision_reason: decision?.verification?.reason,
            risk_score: decision?.verification?.riskLabels
              ? Math.min(decision.verification.riskLabels.length * 20, 100)
              : null,
            verified_at: decision?.verification?.acceptanceTime || null,
            raw_response: { session: sessionData, decision, person },
            metadata: {
              imported: true,
              imported_at: new Date().toISOString(),
              external_source: true,
            },
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error insertando sesión ${veriffSessionId}:`, insertError);
          errors++;
          results.push({ id: veriffSessionId, status: "error", reason: insertError.message });
          continue;
        }

        // Guardar documento si existe
        if (decision?.document) {
          await saveDocument(supabase, newSession.id, decision, person);
        }

        // Guardar intentos si existen
        if (attempts && attempts.length > 0) {
          await saveAttempts(supabase, newSession.id, attempts);
        }

        // Descargar media
        await downloadMedia(supabase, newSession.id, targetOrgId, veriffSessionId);

        imported++;
        results.push({
          id: veriffSessionId,
          status: "imported",
          internalId: newSession.id,
          verificationStatus: status,
        });

        console.log(`✅ Sesión ${veriffSessionId} importada como ${newSession.id}`);
      } catch (error: any) {
        console.error(`Error procesando ${veriffSessionId}:`, error);
        errors++;
        results.push({ id: veriffSessionId, status: "error", reason: error.message });
      }
    }

    // Registrar en audit log
    await supabase
      .from("identity_verification_audit_log")
      .insert({
        event_type: "bulk_import",
        event_data: { imported, skipped, errors, total: sessionIds.length },
        actor_type: "system",
      });

    return new Response(
      JSON.stringify({ success: true, imported, skipped, errors, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// =====================================================
// HELPERS: Veriff API
// =====================================================

async function fetchSessionData(sessionId: string): Promise<any> {
  try {
    const res = await fetch(`https://stationapi.veriff.com/v1/sessions/${sessionId}`, {
      headers: { "X-AUTH-CLIENT": VERIFF_API_KEY },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchDecision(sessionId: string): Promise<any> {
  try {
    const res = await fetch(`https://stationapi.veriff.com/v1/sessions/${sessionId}/decision`, {
      headers: { "X-AUTH-CLIENT": VERIFF_API_KEY },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchPerson(sessionId: string): Promise<any> {
  try {
    const res = await fetch(`https://stationapi.veriff.com/v1/sessions/${sessionId}/person`, {
      headers: { "X-AUTH-CLIENT": VERIFF_API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.person || data;
  } catch { return null; }
}

async function fetchAttempts(sessionId: string): Promise<any[]> {
  try {
    const res = await fetch(`https://stationapi.veriff.com/v1/sessions/${sessionId}/attempts`, {
      headers: { "X-AUTH-CLIENT": VERIFF_API_KEY },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.attempts || [];
  } catch { return []; }
}

async function saveDocument(supabase: any, sessionId: string, decision: any, person: any) {
  try {
    const doc = decision.document;
    if (!doc) return;

    await supabase.from("identity_verification_documents").insert({
      session_id: sessionId,
      document_type: mapDocType(doc.type),
      document_country: doc.country,
      document_number: doc.number,
      first_name: person?.firstName,
      last_name: person?.lastName,
      date_of_birth: person?.dateOfBirth,
      expiry_date: doc.validUntil,
      is_expired: doc.validUntil ? new Date(doc.validUntil) < new Date() : null,
      validation_checks: decision.verification || {},
      confidence_score: decision.verification?.code === 9001 ? 1.0 : 0.5,
    });
  } catch (e) { console.error("Error guardando documento:", e); }
}

async function saveAttempts(supabase: any, sessionId: string, attempts: any[]) {
  try {
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      await supabase.from("identity_verification_attempts").insert({
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
  } catch (e) { console.error("Error guardando intentos:", e); }
}

function mapAttemptStatus(s: string): string {
  const m: Record<string, string> = {
    created: "pending", started: "in_progress", submitted: "completed",
    approved: "completed", declined: "failed", expired: "failed",
  };
  return m[s] || "pending";
}

async function downloadMedia(supabase: any, sessionId: string, orgId: string, veriffId: string) {
  try {
    const res = await fetch(`https://stationapi.veriff.com/v1/sessions/${veriffId}/media`, {
      headers: { "X-AUTH-CLIENT": VERIFF_API_KEY },
    });
    if (!res.ok) return;
    const data = await res.json();
    const images = data.images || [];

    for (const img of images) {
      try {
        const dlRes = await fetch(img.url);
        if (!dlRes.ok) continue;
        const buffer = await (await dlRes.blob()).arrayBuffer();

        const mediaType = mapMediaType(img.context);
        const ext = img.mimeType === "video/mp4" ? "mp4" : "jpg";
        const path = `${orgId}/${sessionId}/${mediaType}_${Date.now()}.${ext}`;

        await supabase.storage.from("identity-verifications").upload(path, buffer, {
          contentType: img.mimeType || "image/jpeg",
        });

        const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
        const checksum = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        await supabase.from("identity_verification_media").insert({
          session_id: sessionId,
          media_type: mediaType,
          provider_media_id: img.id,
          storage_path: path,
          file_size: buffer.byteLength,
          mime_type: img.mimeType || "image/jpeg",
          downloaded_at: new Date().toISOString(),
          checksum,
        });
      } catch (e) { console.error("Error descargando media:", e); }
    }
  } catch (e) { console.error("Error obteniendo media:", e); }
}

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    created: "pending", started: "started", submitted: "submitted",
    approved: "approved", declined: "declined", expired: "expired",
    abandoned: "abandoned", resubmission_requested: "resubmission_requested",
  };
  return m[s] || "pending";
}

function mapMediaType(c: string): string {
  const m: Record<string, string> = {
    "document-front": "document_front", "document-back": "document_back",
    face: "face_photo", selfie: "selfie", video: "liveness_video",
  };
  return m[c] || "selfie";
}

function mapDocType(t: string): string {
  const m: Record<string, string> = {
    ID_CARD: "national_id", PASSPORT: "passport",
    DRIVERS_LICENSE: "drivers_license", RESIDENCE_PERMIT: "residence_permit",
  };
  return m[t] || "other";
}
