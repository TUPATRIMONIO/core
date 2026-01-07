import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: Cron job para reintentar revisiones IA estancadas
 * 
 * GET /api/cron/retry-ai-reviews
 * 
 * Esta ruta es llamada por Vercel Cron cada 10 minutos.
 * Busca documentos en estado 'pending_ai_review' que no han sido actualizados en 15 minutos
 * y reintenta la invocación de la Edge Function.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación con CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("⚠️ CRON_SECRET no configurado en variables de entorno");
      return NextResponse.json(
        { error: "CRON_SECRET no configurado" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ Intento de acceso no autorizado al cron job de retry-ai-reviews");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    console.log(`[CRON-Retry-AI] Buscando documentos estancados desde ${fifteenMinutesAgo}...`);

    // 2. Buscar documentos estancados en pending_ai_review
    // Limitamos a 10 por ejecución para no saturar los recursos de IA
    const { data: stuckDocs, error: fetchError } = await supabase
      .from('signing_documents')
      .select('id, ai_review_retry_count, updated_at')
      .eq('status', 'pending_ai_review')
      .eq('requires_ai_review', true)
      .lt('updated_at', fifteenMinutesAgo)
      .lt('ai_review_retry_count', 3) // Máximo 3 reintentos automáticos
      .order('updated_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[CRON-Retry-AI] Error al buscar documentos:", fetchError);
      throw fetchError;
    }

    if (!stuckDocs || stuckDocs.length === 0) {
      console.log("[CRON-Retry-AI] No se encontraron documentos estancados que requieran reintento.");
      return NextResponse.json({ 
        success: true, 
        message: "No se encontraron documentos estancados que requieran reintento." 
      });
    }

    console.log(`[CRON-Retry-AI] Se encontraron ${stuckDocs.length} documentos estancados.`);

    const results = [];

    // 3. Procesar cada documento
    for (const doc of stuckDocs) {
      try {
        // Verificar si ya tiene una revisión completada (por si hubo un lag en la actualización del estado)
        const { data: existingReview, error: reviewError } = await supabase
          .from('signing_ai_reviews')
          .select('id, status, completed_at')
          .eq('document_id', doc.id)
          .eq('review_type', 'internal_document_review')
          .not('completed_at', 'is', null)
          .maybeSingle();

        if (existingReview) {
          console.log(`[CRON-Retry-AI] Documento ${doc.id} ya tiene una revisión completada. Saltando.`);
          results.push({ id: doc.id, status: 'skipped', reason: 'already_completed' });
          continue;
        }

        const currentRetryCount = doc.ai_review_retry_count || 0;
        console.log(`[CRON-Retry-AI] Reintentando revisión para documento ${doc.id} (intento ${currentRetryCount + 1})...`);

        // Incrementar contador de reintentos y actualizar updated_at para que no lo tome el próximo cron inmediatamente
        const { error: updateError } = await supabase
          .from('signing_documents')
          .update({ 
            ai_review_retry_count: currentRetryCount + 1,
            updated_at: new Date().toISOString() 
          })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`[CRON-Retry-AI] Error incrementando reintentos para ${doc.id}:`, updateError);
          results.push({ id: doc.id, status: 'error', error: 'failed_to_update_retry_count' });
          continue;
        }

        // Invocar Edge Function de forma asíncrona
        // No usamos await aquí para no bloquear el bucle si la IA tarda mucho, 
        // pero queremos capturar errores de invocación inmediata.
        const { data, error: invokeError } = await supabase.functions.invoke('internal-document-review', {
          body: { document_id: doc.id },
        });

        if (invokeError) {
          console.error(`[CRON-Retry-AI] Error invocando revisión para ${doc.id}:`, invokeError);
          results.push({ id: doc.id, status: 'failed', error: invokeError.message });
        } else {
          console.log(`[CRON-Retry-AI] Invocación exitosa para ${doc.id}:`, data);
          results.push({ id: doc.id, status: 'success' });
        }
      } catch (err: any) {
        console.error(`[CRON-Retry-AI] Excepción procesando ${doc.id}:`, err);
        results.push({ id: doc.id, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: stuckDocs.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ [CRON-Retry-AI] Error crítico en el cronjob:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

