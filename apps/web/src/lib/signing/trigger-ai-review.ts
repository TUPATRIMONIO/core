import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Dispara la revisión IA para todos los documentos pendientes de una orden.
 * Esta función es invocada desde el servidor (Next.js) después de confirmar un pago.
 */
export async function triggerAIReviewForOrder(orderId: string) {
  const supabase = createServiceRoleClient();

  console.log(`[AI-Review-Trigger] Iniciando disparador para orden ${orderId}...`);

  try {
    // 1. Buscar documentos relacionados que requieren revisión IA y están pendientes
    const { data: documents, error: fetchError } = await supabase
      .from('signing_documents')
      .select('id, status, requires_ai_review')
      .eq('order_id', orderId)
      .eq('requires_ai_review', true)
      .in('status', ['draft', 'pending_ai_review']);

    if (fetchError) {
      console.error('[AI-Review-Trigger] Error al buscar documentos:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!documents || documents.length === 0) {
      console.log('[AI-Review-Trigger] No se encontraron documentos que requieran revisión IA para esta orden.');
      return { success: true, count: 0 };
    }

    console.log(`[AI-Review-Trigger] Se encontraron ${documents.length} documentos para procesar.`);

    // 2. Invocar la Edge Function para cada documento
    // Lo hacemos de forma asíncrona pero sin esperar a que terminen todas (fire and forget o paralelo limitado)
    const results = await Promise.all(
      documents.map(async (doc) => {
        try {
          console.log(`[AI-Review-Trigger] Invocando revisión para documento ${doc.id}...`);
          
          // Primero aseguramos que el estado sea pending_ai_review
          if (doc.status !== 'pending_ai_review') {
            await supabase
              .from('signing_documents')
              .update({ status: 'pending_ai_review', updated_at: new Date().toISOString() })
              .eq('id', doc.id);
          }

          // Invocamos la Edge Function de forma asíncrona
          // Usamos invoke sin esperar la respuesta completa si es posible, 
          // pero las edge functions suelen ser síncronas en su ejecución HTTP
          const { data, error } = await supabase.functions.invoke('internal-document-review', {
            body: { document_id: doc.id },
          });

          if (error) {
            console.error(`[AI-Review-Trigger] Error en Edge Function para documento ${doc.id}:`, error);
            return { id: doc.id, success: false, error };
          }

          return { id: doc.id, success: true, data };
        } catch (err) {
          console.error(`[AI-Review-Trigger] Excepción procesando documento ${doc.id}:`, err);
          return { id: doc.id, success: false, error: err };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`[AI-Review-Trigger] Proceso completado. Exitosos: ${successCount}/${documents.length}`);

    return { 
      success: true, 
      count: documents.length, 
      successCount,
      results 
    };
  } catch (error: any) {
    console.error('[AI-Review-Trigger] Error crítico en disparador:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}

