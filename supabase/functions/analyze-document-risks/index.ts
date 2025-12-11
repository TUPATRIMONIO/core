import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AIRiskAnalysis {
  risks: Array<{
    level: "high" | "medium" | "low";
    text: string;
    explanation: string;
    clause?: string;
  }>;
  summary?: string;
}

serve(async (req) => {
  // Manejo de preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { document_id } = await req.json();

    if (!document_id) {
      throw new Error("document_id es requerido");
    }

    // 1. Obtener documento de la base de datos
    const { data: document, error: docError } = await supabaseClient
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Error al obtener documento: ${docError?.message}`);
    }

    // Verificar que requiere revisión por IA
    if (!document.requires_ai_review) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Documento no requiere revisión por IA",
          skipped: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Descargar PDF desde Storage
    const filePath = document.original_file_path;
    if (!filePath) {
      throw new Error("Documento no tiene archivo asociado");
    }

    // Construir path completo si es necesario
    const storagePath = filePath.includes("/")
      ? filePath
      : `${document.organization_id}/${document.id}/${filePath}`;

    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from("signing-documents")
      .download(storagePath);

    if (downloadError) {
      // Intentar path alternativo
      const altPath = `${document.organization_id}/${document.id}/${document.original_file_name}`;
      const { data: altFileData, error: altError } = await supabaseClient
        .storage
        .from("signing-documents")
        .download(altPath);

      if (altError) {
        throw new Error(
          `Error al descargar PDF: ${downloadError.message} o ${altError.message}`
        );
      }

      var pdfBytes = await altFileData.arrayBuffer();
    } else {
      var pdfBytes = await fileData.arrayBuffer();
    }

    // 3. Extraer texto del PDF
    // Usar una librería ligera o servicio externo
    // Opción 1: Usar pdf-parse desde esm.sh (puede ser pesado)
    // Opción 2: Enviar a un servicio externo de extracción
    // Por ahora, intentaremos usar pdf-parse desde esm.sh
    let extractedText: string;

    try {
      // Intentar usar pdf-parse si está disponible
      const pdfParse = await import("https://esm.sh/pdf-parse@1.1.1");
      const pdfData = await pdfParse.default(Buffer.from(pdfBytes));
      extractedText = pdfData.text;
    } catch (parseError) {
      // Fallback: Si pdf-parse no funciona, usar un servicio externo o marcar como error
      console.warn("Error al extraer texto con pdf-parse:", parseError);
      
      // Alternativa: Usar un servicio de extracción de texto
      // Por ahora, lanzamos error para que se maneje manualmente
      throw new Error(
        "No se pudo extraer texto del PDF. Se requiere configuración adicional de librerías."
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("No se pudo extraer texto del PDF o el documento está vacío");
    }

    // Limitar longitud del texto para evitar tokens excesivos (máximo ~100k caracteres)
    const maxLength = 100000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + "\n\n[... texto truncado ...]";
    }

    // 4. Llamar a OpenAI para análisis
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY no está configurada");
    }

    const prompt = `Analiza el siguiente contrato legal y identifica cláusulas de riesgo. 
Responde SOLO en formato JSON válido con esta estructura exacta:
{
  "risks": [
    {
      "level": "high" | "medium" | "low",
      "text": "Texto de la cláusula problemática",
      "explanation": "Explicación del riesgo",
      "clause": "Número o referencia de la cláusula (opcional)"
    }
  ],
  "summary": "Resumen general del análisis (opcional)"
}

Contrato a analizar:
${extractedText}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional antes o después.`;

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Modelo más económico y rápido
          messages: [
            {
              role: "system",
              content:
                "Eres un experto en análisis de contratos legales. Identifica riesgos y cláusulas problemáticas. Responde siempre en JSON válido.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3, // Más determinista para análisis legal
          max_tokens: 2000,
          response_format: { type: "json_object" }, // Forzar JSON
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(
        `Error al llamar a OpenAI: ${openaiResponse.status} - ${errorText}`
      );
    }

    const openaiData = await openaiResponse.json();
    const aiAnalysisText = openaiData.choices[0]?.message?.content;

    if (!aiAnalysisText) {
      throw new Error("OpenAI no devolvió una respuesta válida");
    }

    // Parsear respuesta JSON
    let analysis: AIRiskAnalysis;
    try {
      analysis = JSON.parse(aiAnalysisText);
    } catch (parseError) {
      // Intentar extraer JSON si hay texto adicional
      const jsonMatch = aiAnalysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No se pudo parsear la respuesta de OpenAI como JSON");
      }
    }

    // Validar estructura
    if (!analysis.risks || !Array.isArray(analysis.risks)) {
      throw new Error("Respuesta de OpenAI no tiene la estructura esperada");
    }

    // 5. Guardar resultado en la base de datos
    const { data: reviewData, error: insertError } = await supabaseClient
      .from("ai_reviews")
      .insert({
        document_id: document_id,
        analysis_result: analysis,
        raw_text_preview: extractedText.substring(0, 1000), // Guardar preview del texto
        status: "completed",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error al guardar análisis: ${insertError.message}`);
    }

    // 6. Opcional: Actualizar estado del documento si hay riesgos altos
    const highRisks = analysis.risks.filter((r) => r.level === "high");
    if (highRisks.length > 0) {
      // Podríamos marcar el documento con una flag o cambiar su estado
      // Por ahora solo lo registramos en el análisis
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Análisis completado exitosamente",
        analysis: analysis,
        review_id: reviewData.id,
        high_risks_count: highRisks.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error en analyze-document-risks:", error);

    // Intentar guardar error en la base de datos si tenemos document_id
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { document_id } = await req.json().catch(() => ({}));
      if (document_id) {
        await supabaseClient.from("ai_reviews").insert({
          document_id: document_id,
          status: "failed",
          error_message: error.message,
          created_at: new Date().toISOString(),
        });
      }
    } catch (dbError) {
      console.error("Error al guardar error en BD:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido al analizar documento",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
