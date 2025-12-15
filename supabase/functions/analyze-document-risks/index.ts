import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ClaudeRiskLevel = "high" | "medium" | "low";

interface ClaudeAnalysisResult {
  passed: boolean;
  confidence_score?: number;
  summary?: string;
  risks?: Array<{
    level: ClaudeRiskLevel;
    text: string;
    explanation: string;
    clause?: string;
  }>;
  suggestions?: string[];
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

  // Limpiar texto: remover markdown code blocks si existen
  let cleaned = text.trim();
  
  // Remover ```json y ``` al inicio/final
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
  cleaned = cleaned.replace(/\s*```\s*$/, "");
  cleaned = cleaned.trim();

  // Intentar parse directo primero
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    // Fallback 1: buscar primer bloque JSON válido
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Fallback 2: buscar cualquier JSON válido en el texto
        const allMatches = cleaned.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (allMatches) {
          for (const match of allMatches) {
            try {
              const parsed = JSON.parse(match);
              // Verificar que tenga la estructura esperada
              if (parsed && typeof parsed === "object" && ("passed" in parsed || "risks" in parsed)) {
                return parsed;
              }
            } catch {
              continue;
            }
          }
        }
      }
    }
    
    // Si todo falla, loguear para debugging
    console.warn("[extractJson] No se pudo extraer JSON válido. Texto recibido:", cleaned.substring(0, 500));
    return null;
  }
}

async function getCreditCost(supabase: ReturnType<typeof createClient>) {
  // Usamos la tabla/VIEW de precios de créditos ya existente
  const { data, error } = await supabase
    .from("credit_prices")
    .select("credit_cost")
    .eq("service_code", "ai_document_review_full")
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo obtener costo de créditos: ${error.message}`);
  }

  const creditCost = Number(data?.credit_cost ?? 0);
  if (!creditCost || Number.isNaN(creditCost) || creditCost <= 0) {
    // fallback seguro
    return 10;
  }

  return creditCost;
}

async function reserveCredits(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  amount: number,
  documentId: string
) {
  const { data, error } = await supabase.rpc("reserve_credits", {
    org_id_param: organizationId,
    amount_param: amount,
    service_code_param: "ai_document_review_full",
    reference_id_param: documentId,
    description_param: "Revisión IA de documento (firma electrónica)",
  });

  if (error || !data) {
    throw new Error(`Créditos insuficientes o error reservando créditos: ${error?.message}`);
  }

  return data as string; // transaction_id
}

async function confirmCredits(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  transactionId: string
) {
  const { error } = await supabase.rpc("confirm_credits", {
    org_id_param: organizationId,
    transaction_id_param: transactionId,
  });

  if (error) {
    throw new Error(`Error confirmando créditos: ${error.message}`);
  }
}

async function releaseCredits(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  transactionId: string
) {
  const { error } = await supabase.rpc("release_credits", {
    org_id_param: organizationId,
    transaction_id_param: transactionId,
  });

  if (error) {
    // No bloquear por release fallido, pero loguear
    console.warn("[releaseCredits] Error:", error.message);
  }
}

async function downloadPdf(
  supabase: ReturnType<typeof createClient>,
  filePath: string,
  fallbacks: Array<{ bucket: string; path: string }>
) {
  // Intento principal en docs-originals
  const primary = await supabase.storage.from("docs-originals").download(filePath);
  if (!primary.error && primary.data) {
    return {
      bucket: "docs-originals",
      bytes: new Uint8Array(await primary.data.arrayBuffer()),
    };
  }

  // Fallbacks
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
    `No se pudo descargar PDF. docs-originals error: ${primary.error?.message || "unknown"}`
  );
}

async function callClaude(
  anthropicApiKey: string,
  countryCode: string,
  pdfBase64: string
) {
  const system =
    "Eres un analista legal experto. Tu tarea es revisar documentos para detectar riesgos y cláusulas problemáticas. " +
    "Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.";

  const countryContext =
    countryCode === "CL"
      ? "Contexto país: Chile. Considera Ley 19.799 de Firma Electrónica, Código Civil y buenas prácticas contractuales." 
      : `Contexto país: ${countryCode}. Considera normas y buenas prácticas contractuales de ese país.`;

  const userPrompt =
    `${countryContext}\n\n` +
    "Analiza el PDF adjunto y responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:\n" +
    "{\n" +
    "  \"passed\": boolean,\n" +
    "  \"confidence_score\": number (debe ser un valor entre 0 y 1),\n" +
    "  \"summary\": string (resumen del análisis),\n" +
    "  \"risks\": [\n" +
    "    { \"level\": \"high\"|\"medium\"|\"low\", \"text\": string, \"explanation\": string, \"clause\": string? (opcional) }\n" +
    "  ],\n" +
    "  \"suggestions\": [string] (array de sugerencias de mejora)\n" +
    "}\n\n" +
    "Criterio: passed=false si hay riesgos altos que impiden avanzar sin correcciones.\n" +
    "IMPORTANTE: Responde SOLO con el JSON, sin markdown, sin ```json, sin texto adicional antes o después.";

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "structured-outputs-2025-11-13",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      temperature: 0.2,
      system,
      output_format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            passed: { type: "boolean" },
            confidence_score: { type: "number" },
            summary: { type: "string" },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  level: { type: "string", enum: ["high", "medium", "low"] },
                  text: { type: "string" },
                  explanation: { type: "string" },
                  clause: { type: "string" },
                },
                required: ["level", "text", "explanation"],
                additionalProperties: false,
              },
            },
            suggestions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["passed", "confidence_score", "summary", "risks", "suggestions"],
          additionalProperties: false,
        },
      },
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
    }),
  });

  const rawText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Claude error ${resp.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);
  
  // Con structured outputs, la respuesta viene en data.content[0].text como JSON válido
  const content = Array.isArray(data?.content) ? data.content : [];
  const textParts = content
    .map((c: any) => {
      if (typeof c?.text === "string") return c.text;
      if (typeof c?.output_text === "string") return c.output_text;
      if (Array.isArray(c?.text)) {
        return c.text
          .filter((t: any) => typeof t === "string")
          .join("\n");
      }
      return null;
    })
    .filter((text): text is string => Boolean(text));

  const combined = textParts.join("\n").trim();
  
  // Con structured outputs, el JSON viene directamente válido
  // Intentar parse directo primero (structured outputs garantiza JSON válido)
  let parsed: unknown = null;
  
  if (combined) {
    try {
      // Intentar parse directo primero
      parsed = JSON.parse(combined);
    } catch (e1) {
      // Si falla, intentar con extractJson como fallback
      console.warn("[callClaude] Parse directo falló, intentando extractJson:", e1);
      parsed = extractJson(combined);
      
      if (!parsed) {
        console.error("[callClaude] No se pudo extraer JSON. Texto recibido:", combined.substring(0, 1000));
        console.error("[callClaude] Respuesta raw de Claude:", JSON.stringify(data, null, 2).substring(0, 2000));
      }
    }
  } else {
    console.error("[callClaude] No se recibió contenido de Claude");
    console.error("[callClaude] Respuesta raw:", JSON.stringify(data, null, 2).substring(0, 2000));
  }

  return {
    raw: data,
    extractedText: combined,
    parsed,
    usage: data?.usage ?? null,
    model: data?.model ?? "claude-sonnet-4-5-20250929",
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
  let creditTxId: string | null = null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payload = await req.json().catch(() => ({}));
    documentId = payload?.document_id ?? null;

    if (!documentId) {
      return jsonResponse(400, { success: false, error: "document_id es requerido" });
    }

    // 1) Obtener documento
    const { data: document, error: docError } = await supabase
      .from("signing_documents")
      .select("id, organization_id, requires_ai_review, original_file_path, original_file_name, metadata, notary_service, signing_order")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Error al obtener documento: ${docError?.message || "not found"}`);
    }

    if (!document.requires_ai_review) {
      return jsonResponse(200, {
        success: true,
        message: "Documento no requiere revisión por IA",
        skipped: true,
      });
    }

    const organizationId = document.organization_id as string;

    // 2) Reservar créditos
    const creditCost = await getCreditCost(supabase);
    creditTxId = await reserveCredits(supabase, organizationId, creditCost, documentId);

    // 3) Crear registro ai_reviews (pending)
    const countryCode =
      (document?.metadata as any)?.country_code?.toString()?.toUpperCase?.() || "CL";

    const { data: createdReview, error: createReviewError } = await supabase
      .from("signing_ai_reviews")
      .insert({
        document_id: documentId,
        review_type: "ai_document_review_full",
        prompt_template: "claude_multimodal_v1",
        prompt_used: null,
        status: "pending",
        ai_model: "claude-sonnet-4-5-20250929",
        metadata: {
          country_code: countryCode,
          credit_cost: creditCost,
          credit_transaction_id: creditTxId,
        },
      })
      .select("id")
      .single();

    if (createReviewError || !createdReview) {
      throw new Error(`Error creando ai_review: ${createReviewError?.message || "unknown"}`);
    }

    reviewId = createdReview.id;

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
      { bucket: "signing-documents", path: filePath },
      { bucket: "signing-documents", path: altPath1 },
      { bucket: "signing-documents", path: altPath2 },
    ]);

    const pdfBase64 = encodeBase64(bytes);

    // 5) Llamar a Claude
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY no está configurada");
    }

    const claude = await callClaude(anthropicApiKey, countryCode, pdfBase64);

    const parsed = claude.parsed as ClaudeAnalysisResult | null;
    
    // Validar que parsed sea un objeto válido con las propiedades esperadas
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("[analyze-document-risks] Claude no devolvió JSON válido");
      console.error("[analyze-document-risks] Parsed value:", parsed);
      console.error("[analyze-document-risks] Tipo de parsed:", typeof parsed);
      console.error("[analyze-document-risks] Texto recibido:", claude.extractedText?.substring(0, 1000));
      console.error("[analyze-document-risks] Respuesta raw:", JSON.stringify(claude.raw, null, 2).substring(0, 2000));
      throw new Error(`Claude no devolvió JSON válido. Respuesta recibida: ${claude.extractedText?.substring(0, 200) || "vacía"}`);
    }
    
    // Validar estructura básica del objeto
    if (!("passed" in parsed) || typeof parsed.passed !== "boolean") {
      console.error("[analyze-document-risks] JSON no tiene estructura válida. Parsed:", JSON.stringify(parsed, null, 2).substring(0, 1000));
      throw new Error(`Claude devolvió JSON con estructura inválida. Falta campo 'passed' o no es boolean.`);
    }

    const passed = !!parsed.passed;
    const confidence =
      typeof parsed.confidence_score === "number" ? parsed.confidence_score : null;

    const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
    const reasons = risks.map((r) => ({
      level: r.level,
      text: r.text,
      explanation: r.explanation,
      clause: r.clause ?? null,
    }));

    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : (typeof (parsed as any).suggestions === "string" ? [(parsed as any).suggestions] : []);

    // 6) Actualizar ai_reviews
    const { error: updateReviewError } = await supabase
      .from("signing_ai_reviews")
      .update({
        status: passed ? "approved" : "rejected",
        passed,
        confidence_score: confidence,
        reasons,
        suggestions,
        raw_response: claude.raw,
        tokens_used: claude.usage?.output_tokens ?? null,
        completed_at: new Date().toISOString(),
        prompt_used: claude.extractedText || null,
        metadata: {
          country_code: countryCode,
          bucket,
          file_path: filePath,
          credit_cost: creditCost,
          credit_transaction_id: creditTxId,
          summary: parsed.summary ?? null,
        },
      })
      .eq("id", reviewId);

    if (updateReviewError) {
      throw new Error(`Error actualizando ai_review: ${updateReviewError.message}`);
    }

    // 7) Confirmar créditos (consumir)
    await confirmCredits(supabase, organizationId, creditTxId);

    return jsonResponse(200, {
      success: true,
      document_id: documentId,
      review_id: reviewId,
      status: passed ? "approved" : "rejected",
      passed,
      confidence_score: confidence,
      summary: parsed.summary ?? null,
    reasons,
    suggestions,
      risks_count: reasons.length,
      credit_cost: creditCost,
    });
  } catch (error: any) {
    console.error("[analyze-document-risks] Error:", error);

    // Release credits if we reserved them
    try {
      if (creditTxId && documentId) {
        // obtener organization_id para liberar
        const { data: doc } = await supabase
          .from("signing_documents")
          .select("organization_id")
          .eq("id", documentId)
          .maybeSingle();

        if (doc?.organization_id) {
          await releaseCredits(supabase, doc.organization_id, creditTxId);
        }
      }
    } catch (releaseErr) {
      console.warn("[analyze-document-risks] Release credits failed:", releaseErr);
    }

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
      console.warn("[analyze-document-risks] Update ai_review failed:", dbErr);
    }

    return jsonResponse(400, {
      success: false,
      error: error?.message || "Error desconocido al analizar documento",
    });
  }
});
