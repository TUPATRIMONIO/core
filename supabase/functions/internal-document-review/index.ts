import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { processPromptVariables } from "../_shared/prompt-variables.ts";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Formato de respuesta esperado (similar a Chile format pero adaptado)
interface InternalReviewResult {
  resultado_revision: "aprobado" | "observado" | "rechazado";
  tipo_documento_detectado: string;
  tipo_documento_coincide: boolean;
  resumen: string;
  puntos_importantes: string[];
  cantidad_firmantes: number;
  observaciones?: Array<{
    tipo: "error" | "advertencia" | "sugerencia";
    descripcion: string;
    fragmento?: string;
  }>;
  razones_rechazo?: string[];
  requisitos_servicio_cumplidos: boolean;
  requisitos_faltantes?: string[];
  confianza: number;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const [type, token] = auth.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function extractJson(text: string): unknown {
  if (!text || typeof text !== "string") {
    return null;
  }

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
  cleaned = cleaned.replace(/\s*```\s*$/, "");
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        const allMatches = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (allMatches) {
          for (const match of allMatches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed && typeof parsed === "object" && "resultado_revision" in parsed) {
                return parsed;
              }
            } catch {
              continue;
            }
          }
        }
      }
    }
    console.warn("[extractJson] No se pudo extraer JSON válido:", cleaned.substring(0, 500));
    return null;
  }
}

async function downloadPdf(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  fallbacks: Array<{ bucket: string; path: string }>,
) {
  const primary = await supabase.storage.from("docs-originals").download(filePath);
  if (!primary.error && primary.data) {
    return {
      bucket: "docs-originals",
      bytes: new Uint8Array(await primary.data.arrayBuffer()),
    };
  }

  for (const fb of fallbacks) {
    const res = await supabase.storage.from(fb.bucket).download(fb.path);
    if (!res.error && res.data) {
      return {
        bucket: fb.bucket,
        bytes: new Uint8Array(await res.data.arrayBuffer()),
      };
    }
  }

  throw new Error(
    `No se pudo descargar PDF. docs-originals error: ${primary.error?.message || "unknown"}`,
  );
}

async function getInternalPrompt(
  supabase: ReturnType<typeof createClient>,
  countryCode: string,
  serviceType: string | null,
  documentType: string | null,
) {
  // Prioridad: prompt específico por servicio + tipo documento > específico por servicio > específico por tipo > genérico
  let prompt = null;

  // 1. Intentar prompt más específico: servicio + tipo documento
  if (serviceType && documentType) {
    const { data } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("feature_type", "internal_document_review")
      .eq("country_code", countryCode)
      .eq("is_internal_review", true)
      .eq("service_type", serviceType)
      .eq("document_type", documentType)
      .eq("is_active", true)
      .maybeSingle();

    if (data) prompt = data;
  }

  // 2. Prompt específico por servicio (sin tipo documento)
  if (!prompt && serviceType) {
    const { data } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("feature_type", "internal_document_review")
      .eq("country_code", countryCode)
      .eq("is_internal_review", true)
      .eq("service_type", serviceType)
      .is("document_type", null)
      .eq("is_active", true)
      .maybeSingle();

    if (data) prompt = data;
  }

  // 3. Prompt específico por tipo documento (sin servicio)
  if (!prompt && documentType) {
    const { data } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("feature_type", "internal_document_review")
      .eq("country_code", countryCode)
      .eq("is_internal_review", true)
      .is("service_type", null)
      .eq("document_type", documentType)
      .eq("is_active", true)
      .maybeSingle();

    if (data) prompt = data;
  }

  // 4. Prompt genérico (sin servicio ni tipo documento)
  if (!prompt) {
    const { data } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("feature_type", "internal_document_review")
      .eq("country_code", countryCode)
      .eq("is_internal_review", true)
      .is("service_type", null)
      .is("document_type", null)
      .eq("is_active", true)
      .maybeSingle();

    if (data) prompt = data;
  }

  // 5. Fallback: prompt genérico para ALL countries
  if (!prompt) {
    const { data } = await supabase
      .from("ai_prompts")
      .select("*")
      .eq("feature_type", "internal_document_review")
      .eq("country_code", "ALL")
      .eq("is_internal_review", true)
      .is("service_type", null)
      .is("document_type", null)
      .eq("is_active", true)
      .maybeSingle();

    if (data) prompt = data;
  }

  return prompt;
}

async function callClaude(
  anthropicApiKey: string,
  promptConfig: any,
  pdfBase64: string,
  documentData: any,
  countryCode: string,
) {
  const variableContext = {
    document: documentData,
    country_code: countryCode,
    country_context: promptConfig.country_context,
    current_date: new Date().toLocaleDateString("es-CL"),
    timezone: "America/Santiago",
  };

  const systemPrompt = processPromptVariables(
    promptConfig.system_prompt,
    variableContext,
  );

  const userPrompt = processPromptVariables(
    promptConfig.user_prompt_template,
    variableContext,
  );

  const hasExplicitSchema = promptConfig.output_schema &&
    typeof promptConfig.output_schema === "object" &&
    Object.keys(promptConfig.output_schema).length > 0;

  const requestBody: Record<string, unknown> = {
    model: promptConfig.ai_model,
    max_tokens: promptConfig.max_tokens,
    temperature: promptConfig.temperature,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdfBase64,
            },
          },
        ],
      },
    ],
  };

  if (hasExplicitSchema) {
    requestBody.output_format = {
      type: "json_schema",
      schema: promptConfig.output_schema,
    };
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      ...(hasExplicitSchema
        ? { "anthropic-beta": "structured-outputs-2025-11-13" }
        : {}),
    },
    body: JSON.stringify(requestBody),
  });

  const rawText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Claude error ${resp.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);
  const content = Array.isArray(data?.content) ? data.content : [];
  const textParts = content
    .map((c: any) => {
      if (typeof c?.text === "string") return c.text;
      if (typeof c?.output_text === "string") return c.output_text;
      return null;
    })
    .filter((text): text is string => Boolean(text));

  const combined = textParts.join("\n").trim();

  let parsed: unknown = null;
  if (combined) {
    try {
      parsed = JSON.parse(combined);
    } catch (e1) {
      parsed = extractJson(combined);
    }
  }

  return {
    raw: data,
    extractedText: combined,
    parsed,
    usage: data?.usage ?? null,
    model: data?.model ?? promptConfig.ai_model,
    processed_system_prompt: systemPrompt,
    processed_user_prompt: userPrompt,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const bearer = getBearerToken(req);
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!bearer || !expected || bearer !== expected) {
    return jsonResponse(401, { success: false, error: "Unauthorized" });
  }

  let documentId: string | null = null;
  let reviewId: string | null = null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload = await req.json().catch(() => ({}));
    documentId = payload?.document_id ?? null;

    if (!documentId) {
      return jsonResponse(400, {
        success: false,
        error: "document_id es requerido",
      });
    }

    // 1) Obtener documento con metadata completa
    const { data: document, error: docError } = await supabase
      .from("signing_documents")
      .select(
        "id, organization_id, requires_ai_review, original_file_path, original_file_name, metadata, notary_service, signing_order, signers_count",
      )
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(
        `Error al obtener documento: ${docError?.message || "not found"}`,
      );
    }

    if (!document.requires_ai_review) {
      return jsonResponse(200, {
        success: true,
        message: "Documento no requiere revisión por IA",
        skipped: true,
      });
    }

    const organizationId = document.organization_id as string;
    const metadata = (document.metadata || {}) as Record<string, any>;
    const countryCode = metadata.country_code?.toString()?.toUpperCase() || "CL";

    // Extraer tipo de servicio y tipo de documento del metadata
    const signatureProduct = metadata.signature_product;
    const notaryProduct = metadata.notary_product;
    const documentType = metadata.document_type; // Tipo de documento legal seleccionado por el usuario

    // Determinar service_type para buscar prompt
    let serviceType: string | null = null;
    if (signatureProduct?.slug) {
      serviceType = signatureProduct.slug;
    } else if (notaryProduct?.slug) {
      serviceType = notaryProduct.slug;
    }

    // 2) Obtener prompt interno específico
    const promptConfig = await getInternalPrompt(
      supabase,
      countryCode,
      serviceType,
      documentType,
    );

    if (!promptConfig) {
      throw new Error(
        `No hay prompt interno activo para ${countryCode}${serviceType ? ` + ${serviceType}` : ""}${documentType ? ` + ${documentType}` : ""}`,
      );
    }

    // 3) Crear registro ai_reviews (pending)
    const insertData: any = {
      document_id: documentId,
      review_type: "internal_document_review",
      prompt_template: promptConfig.name,
      prompt_id: promptConfig.id,
      prompt_version: promptConfig.version,
      status: "pending",
      ai_model: promptConfig.ai_model,
      metadata: {
        country_code: countryCode,
        service_type: serviceType,
        document_type: documentType,
        signature_product: signatureProduct,
        notary_product: notaryProduct,
        is_internal: true,
      },
    };

    const result = await supabase
      .from("signing_ai_reviews")
      .insert(insertData)
      .select("id")
      .single();

    if (result.error || !result.data) {
      throw new Error(
        `Error creando ai_review: ${result.error?.message || "unknown"}`,
      );
    }

    reviewId = result.data.id;

    // 4) Descargar PDF
    const filePath = document.original_file_path as string | null;
    if (!filePath) {
      throw new Error("Documento no tiene original_file_path");
    }

    const orgId = organizationId;
    const altPath1 = `${orgId}/${documentId}/${document.original_file_name || "original.pdf"}`;
    const altPath2 = `${orgId}/${documentId}/${documentId}_original.pdf`;

    const { bytes, bucket } = await downloadPdf(supabase, filePath, [
      { bucket: "docs-originals", path: altPath1 },
      { bucket: "docs-originals", path: altPath2 },
      { bucket: "docs-signed", path: filePath },
      { bucket: "docs-signed", path: altPath1 },
      { bucket: "docs-signed", path: altPath2 },
    ]);

    const pdfBase64 = encodeBase64(bytes);

    // 5) Llamar a Claude
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY no está configurada");
    }

    const claude = await callClaude(
      anthropicApiKey,
      promptConfig,
      pdfBase64,
      {
        ...document,
        document_type: documentType,
        service_type: serviceType,
      },
      countryCode,
    );

    const parsed = claude.parsed as InternalReviewResult | null;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("[internal-document-review] Claude no devolvió JSON válido");
      throw new Error(
        `Claude no devolvió JSON válido. Respuesta recibida: ${
          claude.extractedText?.substring(0, 200) || "vacía"
        }`,
      );
    }

    // Mapear resultado a status
    const resultadoMap: Record<
      string,
      { passed: boolean; status: "approved" | "rejected" | "needs_changes" }
    > = {
      "aprobado": { passed: true, status: "approved" },
      "observado": { passed: false, status: "needs_changes" },
      "rechazado": { passed: false, status: "rejected" },
    };

    const mapping = resultadoMap[parsed.resultado_revision] ||
      { passed: false, status: "rejected" };
    const passed = mapping.passed;
    const status = mapping.status;

    // Mapear observaciones a reasons format
    const reasons = (parsed.observaciones || []).map((obs) => ({
      level: obs.tipo === "error"
        ? "high"
        : obs.tipo === "advertencia"
        ? "medium"
        : "low",
      text: obs.descripcion,
      explanation: obs.fragmento || obs.descripcion,
      clause: null,
    }));

    const suggestions = [
      ...(parsed.razones_rechazo || []),
      ...(parsed.requisitos_faltantes || []),
    ];

    // 6) Actualizar ai_reviews
    const { error: updateReviewError } = await supabase
      .from("signing_ai_reviews")
      .update({
        status,
        passed,
        confidence_score: parsed.confianza || null,
        reasons,
        suggestions,
        raw_response: claude.raw,
        tokens_used: claude.usage?.output_tokens ?? null,
        completed_at: new Date().toISOString(),
        prompt_used: claude.processed_user_prompt || null,
        metadata: {
          country_code: countryCode,
          bucket,
          file_path: filePath,
          summary: parsed.resumen,
          tipo_documento_detectado: parsed.tipo_documento_detectado,
          tipo_documento_coincide: parsed.tipo_documento_coincide,
          requisitos_servicio_cumplidos: parsed.requisitos_servicio_cumplidos,
          requisitos_faltantes: parsed.requisitos_faltantes,
          puntos_importantes: parsed.puntos_importantes,
          prompt_config: {
            id: promptConfig.id,
            version: promptConfig.version,
            processed_system: claude.processed_system_prompt,
          },
        },
      })
      .eq("id", reviewId);

    if (updateReviewError) {
      throw new Error(
        `Error actualizando ai_review: ${updateReviewError.message}`,
      );
    }

    return jsonResponse(200, {
      success: true,
      document_id: documentId,
      review_id: reviewId,
      status,
      passed,
      confidence_score: parsed.confianza,
      summary: parsed.resumen,
      tipo_documento_coincide: parsed.tipo_documento_coincide,
      requisitos_servicio_cumplidos: parsed.requisitos_servicio_cumplidos,
      reasons,
      suggestions,
      risks_count: reasons.length,
    });
  } catch (error: any) {
    console.error("[internal-document-review] Error:", error);

    // Update ai_review if it was created
    try {
      if (reviewId) {
        await supabase
          .from("signing_ai_reviews")
          .update({
            status: "rejected",
            passed: false,
            completed_at: new Date().toISOString(),
            metadata: {
              error: error?.message || "Error desconocido",
            },
          })
          .eq("id", reviewId);
      }
    } catch (dbErr) {
      console.warn("[internal-document-review] Update ai_review failed:", dbErr);
    }

    return jsonResponse(400, {
      success: false,
      error: error?.message || "Error desconocido al analizar documento",
    });
  }
});

