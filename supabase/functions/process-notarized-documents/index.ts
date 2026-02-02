import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import jsQR from "https://esm.sh/jsqr@1.4.0";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
    batch_id: string;
    notary_office_id: string;
}

/**
 * Convierte una página PDF a datos de imagen (ImageData) para lectura de QR
 * Usa canvas para renderizar la página
 */
async function pdfPageToImageData(
    pdfBytes: Uint8Array,
    pageIndex: number,
): Promise<ImageData | null> {
    try {
        // Cargar PDF
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        if (pageIndex >= pages.length) {
            return null;
        }

        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        // Para Deno, necesitamos una forma de renderizar el PDF
        // Como no tenemos Canvas nativo, usaremos un enfoque alternativo:
        // Retornar null y dejar que el QR sea detectado de otra forma
        // En producción, se podría usar un servicio externo de conversión PDF->imagen
        
        console.log(
            `[pdfPageToImageData] PDF página ${pageIndex} tamaño: ${width}x${height}`,
        );

        // Por ahora, retornamos null para indicar que necesitamos otro método
        return null;
    } catch (error) {
        console.error(
            `[pdfPageToImageData] Error procesando página ${pageIndex}:`,
            error,
        );
        return null;
    }
}

/**
 * Busca QR en un PDF escaneando todas las páginas
 * NOTA: Esta es una implementación simplificada
 * En producción, se debería usar un servicio externo de OCR/QR
 */
async function searchQRInPDF(pdfBytes: Uint8Array): Promise<string | null> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();

        console.log(`[searchQRInPDF] PDF tiene ${pageCount} páginas`);

        // Intentar extraer texto del PDF buscando patrones de URL
        // Este es un enfoque simplificado que busca UUIDs directamente en el contenido
        const textContent = await extractTextFromPDF(pdfBytes);

        // Buscar patrón de UUID en el texto
        const uuidPattern =
            /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
        const matches = textContent.match(uuidPattern);

        if (matches && matches.length > 0) {
            // Retornar el primer UUID encontrado (asumiendo que es del documento)
            console.log(`[searchQRInPDF] UUID encontrado: ${matches[0]}`);
            return matches[0];
        }

        console.log("[searchQRInPDF] No se encontró UUID en el PDF");
        return null;
    } catch (error) {
        console.error("[searchQRInPDF] Error:", error);
        return null;
    }
}

/**
 * Extrae texto de un PDF (método simplificado)
 */
async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
    try {
        // Convertir bytes a string y buscar patrones
        const text = new TextDecoder().decode(pdfBytes);
        return text;
    } catch (error) {
        console.error("[extractTextFromPDF] Error:", error);
        return "";
    }
}

/**
 * Procesa un archivo individual del batch
 */
async function processFile(
    supabase: any,
    fileRecord: any,
    notaryOfficeId: string,
): Promise<{
    success: boolean;
    documentId?: string;
    error?: string;
}> {
    try {
        console.log(
            `[processFile] Procesando: ${fileRecord.original_filename}`,
        );

        // 1. Descargar archivo desde Storage temporal
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("notary-documents")
            .download(fileRecord.temp_storage_path);

        if (downloadError || !fileData) {
            throw new Error(
                `Error descargando archivo: ${downloadError?.message}`,
            );
        }

        const pdfBytes = new Uint8Array(await fileData.arrayBuffer());

        // 2. Buscar QR/UUID en el PDF
        const qrData = await searchQRInPDF(pdfBytes);

        if (!qrData) {
            throw new Error(
                "No se encontró código QR o UUID en el documento",
            );
        }

        // 3. Extraer UUID del QR (usando función SQL)
        const { data: documentId, error: extractError } = await supabase.rpc(
            "extract_uuid_from_qr_url",
            { qr_text: qrData },
        );

        if (extractError || !documentId) {
            throw new Error(
                `No se pudo extraer UUID válido del QR: ${qrData}`,
            );
        }

        console.log(`[processFile] UUID extraído: ${documentId}`);

        // 4. Validar que el documento existe y tiene asignación a esta notaría
        const { data: assignment, error: assignmentError } = await supabase
            .from("signing_notary_assignments")
            .select(`
        id,
        status,
        document:signing_documents(
          id,
          title,
          organization_id,
          status,
          notary_service
        )
      `)
            .eq("document_id", documentId)
            .eq("notary_office_id", notaryOfficeId)
            .maybeSingle();

        if (assignmentError || !assignment) {
            throw new Error(
                "Documento no encontrado o no asignado a esta notaría",
            );
        }

        if (assignment.status === "completed") {
            throw new Error("Este documento ya fue procesado");
        }

        if (
            assignment.status !== "pending" &&
            assignment.status !== "in_progress" &&
            assignment.status !== "received"
        ) {
            throw new Error(`Estado inválido para procesar: ${assignment.status}`);
        }

        const doc = assignment.document;

        // 5. Copiar archivo a bucket final (docs-notarized)
        const finalPath =
            `${doc.organization_id}/${doc.id}/v1/notarized.pdf`;

        const { error: uploadError } = await supabase.storage
            .from("docs-notarized")
            .upload(finalPath, pdfBytes, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Error subiendo a destino final: ${uploadError.message}`);
        }

        console.log(`[processFile] Archivo copiado a: ${finalPath}`);

        // 6. Actualizar asignación a completed
        const now = new Date().toISOString();
        const { error: assignUpdateError } = await supabase
            .from("signing_notary_assignments")
            .update({
                status: "completed",
                notarized_file_path: finalPath,
                completed_at: now,
            })
            .eq("id", assignment.id);

        if (assignUpdateError) {
            throw new Error(`Error actualizando asignación: ${assignUpdateError.message}`);
        }

        // 7. Actualizar documento a notarized
        const { error: docUpdateError } = await supabase
            .from("signing_documents")
            .update({
                status: "notarized",
                updated_at: now,
            })
            .eq("id", doc.id);

        if (docUpdateError) {
            throw new Error(`Error actualizando documento: ${docUpdateError.message}`);
        }

        // 8. Registrar versión en document_versions
        const { data: latestVersion } = await supabase
            .from("signing_document_versions")
            .select("version_number")
            .eq("document_id", doc.id)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

        await supabase.from("signing_document_versions").insert({
            document_id: doc.id,
            version_number: nextVersionNumber,
            version_type: "notarized",
            file_path: finalPath,
            file_name: "notarized.pdf",
            file_size: pdfBytes.length,
        });

        // 9. Eliminar archivo temporal
        await supabase.storage
            .from("notary-documents")
            .remove([fileRecord.temp_storage_path]);

        console.log(
            `[processFile] ✓ Documento ${doc.title} procesado exitosamente`,
        );

        return {
            success: true,
            documentId: doc.id,
        };
    } catch (error: any) {
        console.error(
            `[processFile] Error procesando ${fileRecord.original_filename}:`,
            error,
        );
        return {
            success: false,
            error: error.message || "Error desconocido",
        };
    }
}

/**
 * Procesa un batch completo
 */
async function processBatch(
    supabase: any,
    batchId: string,
    notaryOfficeId: string,
): Promise<void> {
    try {
        console.log(`[processBatch] Iniciando procesamiento de batch: ${batchId}`);

        // 1. Marcar batch como processing
        await supabase
            .from("signing_notary_upload_batches")
            .update({
                status: "processing",
                updated_at: new Date().toISOString(),
            })
            .eq("id", batchId);

        // 2. Obtener archivos pendientes
        const { data: files, error: filesError } = await supabase
            .from("signing_notary_upload_files")
            .select("*")
            .eq("batch_id", batchId)
            .eq("status", "pending");

        if (filesError || !files || files.length === 0) {
            throw new Error("No se encontraron archivos para procesar");
        }

        console.log(`[processBatch] ${files.length} archivos a procesar`);

        // 3. Procesar cada archivo
        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const file of files) {
            // Marcar archivo como processing
            await supabase
                .from("signing_notary_upload_files")
                .update({ status: "processing" })
                .eq("id", file.id);

            const result = await processFile(supabase, file, notaryOfficeId);

            if (result.success) {
                successCount++;
                await supabase
                    .from("signing_notary_upload_files")
                    .update({
                        status: "success",
                        document_id: result.documentId,
                        processed_at: new Date().toISOString(),
                    })
                    .eq("id", file.id);
            } else {
                failureCount++;
                await supabase
                    .from("signing_notary_upload_files")
                    .update({
                        status: "failed",
                        error_message: result.error,
                        processed_at: new Date().toISOString(),
                    })
                    .eq("id", file.id);
            }

            results.push({
                filename: file.original_filename,
                success: result.success,
                documentId: result.documentId,
                error: result.error,
            });
        }

        // 4. Actualizar batch con resultados finales
        await supabase
            .from("signing_notary_upload_batches")
            .update({
                status: "completed",
                processed_files: files.length,
                successful_files: successCount,
                failed_files: failureCount,
                results: results,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", batchId);

        console.log(
            `[processBatch] ✓ Batch completado: ${successCount} exitosos, ${failureCount} fallidos`,
        );

        // 5. Enviar notificación con resultados
        try {
            const { data: batch } = await supabase
                .from("signing_notary_upload_batches")
                .select(`
          *,
          notary_office:signing_notary_offices(name, email, organization_id)
        `)
                .eq("id", batchId)
                .single();

            if (batch?.notary_office?.email) {
                console.log(
                    `[processBatch] Enviando notificación a: ${batch.notary_office.email}`,
                );

                const notificationUrl = `${
                    Deno.env.get("SUPABASE_URL")
                }/functions/v1/send-signing-notification`;

                const baseUrl = Deno.env.get("PUBLIC_APP_URL") ||
                    "https://tupatrimonio.app";
                const actionUrl = `${baseUrl}/dashboard/notary`;

                await fetch(notificationUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${
                            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
                        }`,
                    },
                    body: JSON.stringify({
                        type: "NOTARY_BATCH_COMPLETED",
                        recipient_email: batch.notary_office.email,
                        recipient_name: batch.notary_office.name,
                        document_title: `Lote de ${files.length} documento(s)`,
                        action_url: actionUrl,
                        org_id: batch.notary_office.organization_id,
                        batch_results: {
                            total: files.length,
                            successful: successCount,
                            failed: failureCount,
                            documents: results,
                        },
                    }),
                });

                console.log("[processBatch] ✓ Notificación enviada");
            }
        } catch (notifError) {
            console.error(
                "[processBatch] Error enviando notificación:",
                notifError,
            );
        }
    } catch (error: any) {
        console.error(`[processBatch] Error crítico:`, error);

        // Marcar batch como failed
        await supabase
            .from("signing_notary_upload_batches")
            .update({
                status: "failed",
                results: [{ error: error.message }],
                updated_at: new Date().toISOString(),
            })
            .eq("id", batchId);
    }
}

/**
 * Servidor principal
 */
serve(async (req) => {
    // Manejo de preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const payload: ProcessRequest = await req.json();

        if (!payload.batch_id || !payload.notary_office_id) {
            throw new Error(
                "Payload incompleto. Requiere: batch_id, notary_office_id",
            );
        }

        // Procesar batch de forma asíncrona
        processBatch(
            supabaseClient,
            payload.batch_id,
            payload.notary_office_id,
        ).catch((error) => {
            console.error("[Main] Error en procesamiento asíncrono:", error);
        });

        // Responder inmediatamente
        return new Response(
            JSON.stringify({
                success: true,
                message: "Procesamiento iniciado",
                batch_id: payload.batch_id,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("[Main] Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Error desconocido",
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
