import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const documentId = (body?.document_id || body?.documentId || "").toString();

    if (!documentId) {
      return NextResponse.json({ error: "document_id es requerido" }, {
        status: 400,
      });
    }

    // Verificar que el usuario tenga acceso al documento (RLS)
    const { data: doc, error: docError } = await supabase
      .from("signing_documents")
      .select("id")
      .eq("id", documentId)
      .maybeSingle();

    if (docError || !doc?.id) {
      console.error("[api/signing/analyze] Documento no encontrado:", {
        documentId,
        docError,
      });
      return NextResponse.json({
        error: "Documento no encontrado o sin acceso",
      }, { status: 404 });
    }

    // Determinar URL de Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      console.error(
        "[api/signing/analyze] SUPABASE_SERVICE_ROLE_KEY no configurada",
      );
      return NextResponse.json({
        error: "Configuración incompleta del servidor",
      }, { status: 500 });
    }

    if (!supabaseUrl) {
      console.error(
        "[api/signing/analyze] NEXT_PUBLIC_SUPABASE_URL no configurada",
      );
      return NextResponse.json({
        error: "Configuración incompleta del servidor",
      }, { status: 500 });
    }

    // Usar la URL de Supabase directamente (funciona tanto en local como en producción)
    const functionUrl = `${supabaseUrl}/functions/v1/analyze-document-risks`;

    console.log("[api/signing/analyze] Llamando a Edge Function:", {
      functionUrl,
      documentId,
    });

    const resp = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ document_id: documentId }),
    });

    const text = await resp.text();

    console.log("[api/signing/analyze] Respuesta Edge Function:", {
      status: resp.status,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
    });

    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text, parse_error: true };
    }

    // Si la Edge Function devolvió error, pasarlo al cliente
    if (!resp.ok) {
      const errorMessage = (json as { error?: string })?.error ||
        (json as { message?: string })?.message ||
        `Error del servidor (${resp.status})`;
      return NextResponse.json({
        error: errorMessage,
        details: json,
      }, { status: resp.status });
    }

    // Incluir datos del ai_review para evitar una segunda consulta desde el cliente
    let aiReviewData: Record<string, unknown> | null = null;
    const reviewId =
      ((json as { review_id?: string; reviewId?: string })?.review_id ||
        (json as { review_id?: string; reviewId?: string })?.reviewId ||
        "").toString();
    const statusFromJson = ((json as { status?: string })?.status || "")
      .toString();

    if (reviewId) {
      try {
        const supabaseAdmin = createServiceRoleClient();
        const { data: review, error: reviewError } = await supabaseAdmin
          .from("signing_ai_reviews")
          .select(
            "id, status, reasons, suggestions, metadata, completed_at, created_at, confidence_score, passed, ai_model, prompt_used",
          )
          .eq("id", reviewId)
          .maybeSingle();

        if (reviewError) {
          console.warn(
            "[api/signing/analyze] No se pudo obtener ai_review por reviewId:",
            reviewError.message,
          );
        } else {
          aiReviewData = review;
        }
      } catch (adminError) {
        console.warn(
          "[api/signing/analyze] Error consultando ai_review con service role:",
          adminError,
        );
      }
    }

    // Fallback: si no pudimos obtener el registro pero la respuesta trae datos suficientes, construimos un objeto para el frontend
    if (!aiReviewData) {
      const reasons = Array.isArray((json as { reasons?: unknown[] })?.reasons)
        ? (json as { reasons?: unknown[] })?.reasons
        : null;
      const suggestions =
        Array.isArray((json as { suggestions?: unknown[] })?.suggestions)
          ? (json as { suggestions?: unknown[] })?.suggestions
          : null;
      const summary = (json as { summary?: string })?.summary;
      const confidenceScore = (json as { confidence_score?: number })
        ?.confidence_score;
      const passedValue = (json as { passed?: boolean })?.passed;

      // Get Chile-specific data from Edge Function response
      const chileData = (json as { chile_data?: Record<string, unknown> })
        ?.chile_data;

      if (reasons || suggestions || summary || chileData) {
        aiReviewData = {
          id: reviewId || null,
          status: statusFromJson ||
            (passedValue === true ? "approved" : "rejected"),
          reasons: reasons || [],
          suggestions: suggestions || [],
          metadata: {
            summary: summary || chileData?.resumen || null,
            // Chile-specific fields
            tipo_documento: chileData?.tipo_documento || null,
            titulo_documento: chileData?.titulo_documento || null,
            puntos_importantes: chileData?.puntos_importantes || [],
            cantidad_firmantes: chileData?.cantidad_firmantes ?? null,
            observaciones: chileData?.observaciones || [],
            razones_rechazo: chileData?.razones_rechazo || [],
            sugerencias_modificacion: chileData?.sugerencias_modificacion || [],
            servicio_notarial_sugerido: chileData?.servicio_notarial_sugerido ||
              null,
            resultado_revision: chileData?.resultado_revision || null,
          },
          confidence_score: confidenceScore ??
            (chileData?.confianza as number | undefined) ?? null,
          passed: passedValue ?? null,
        };
      }
    }

    return NextResponse.json(
      {
        ...json,
        ai_review: aiReviewData,
      },
      { status: resp.status },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[api/signing/analyze] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno del servidor" },
      { status: 500 },
    );
  }
}
