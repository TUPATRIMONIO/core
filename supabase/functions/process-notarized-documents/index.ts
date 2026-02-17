import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getDocument } from "https://esm.sh/pdfjs-serverless@1.1.0";

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
 * Extrae texto de un PDF usando pdfjs-serverless (Nivel 1 - Más confiable)
 * Descomprime content streams y extrae texto correctamente de todas las páginas
 */
async function extractTextWithPdfJs(pdfBytes: Uint8Array): Promise<string[]> {
    try {
        console.log("[extractTextWithPdfJs] Cargando PDF para extracción de texto...");
        const pdf = await getDocument({ data: pdfBytes, useSystemFonts: true }).promise;
        console.log(`[extractTextWithPdfJs] PDF cargado, ${pdf.numPages} páginas`);

        const pageTexts: string[] = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            try {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const text = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");
                pageTexts.push(text);
                console.log(`[extractTextWithPdfJs] Página ${i}: ${text.length} chars extraídos`);
            } catch (pageError) {
                console.warn(`[extractTextWithPdfJs] Error en página ${i}:`, pageError);
                pageTexts.push("");
            }
        }

        return pageTexts;
    } catch (error) {
        console.error("[extractTextWithPdfJs] Error:", error);
        return [];
    }
}

/**
 * Extrae texto de un PDF buscando en bytes crudos (Nivel 2 - Fallback)
 */
function extractTextFromRawBytes(pdfBytes: Uint8Array): string {
    try {
        const rawContent = Array.from(pdfBytes)
            .map((byte) => String.fromCharCode(byte))
            .join("");

        let utf8Content = "";
        try {
            utf8Content = new TextDecoder("utf-8", { fatal: false }).decode(pdfBytes);
        } catch {
            // Ignorar errores de decodificación
        }

        return rawContent + "\n" + utf8Content;
    } catch (error) {
        console.error("[extractTextFromRawBytes] Error:", error);
        return "";
    }
}

/**
 * Busca QR Identifier en un PDF con estrategia de 2 niveles
 *
 * Nivel 1: Extracción de texto con pdfjs-serverless (descomprime streams, más confiable)
 * Nivel 2: Búsqueda en bytes crudos del PDF (fallback)
 */
async function searchQRInPDF(pdfBytes: Uint8Array): Promise<{ identifier: string | null; debug: string }> {
    const debugInfo: string[] = [];
    const qrIdentifierPattern = /DOC-[A-F0-9]{8}-[A-F0-9]{8}/gi;

    try {
        // --- NIVEL 1: Extracción de texto con pdfjs-serverless ---
        console.log("[searchQRInPDF] Nivel 1: Extrayendo texto con pdfjs-serverless...");
        const pageTexts = await extractTextWithPdfJs(pdfBytes);

        for (let i = 0; i < pageTexts.length; i++) {
            const matches = pageTexts[i].match(qrIdentifierPattern);
            if (matches && matches.length > 0) {
                const identifier = matches[0].toUpperCase();
                console.log(`[searchQRInPDF] ✓ Encontrado en Nivel 1 (Página ${i + 1}): ${identifier}`);
                return { identifier, debug: `Nivel 1 (Texto Pág ${i + 1})` };
            }
        }
        debugInfo.push(`Nivel 1: No encontrado en ${pageTexts.length} páginas`);

        // --- NIVEL 2: Búsqueda en bytes crudos (Fallback) ---
        console.log("[searchQRInPDF] Nivel 2: Buscando en bytes crudos...");
        const rawText = extractTextFromRawBytes(pdfBytes);
        const rawMatches = rawText.match(qrIdentifierPattern);

        if (rawMatches && rawMatches.length > 0) {
            const identifier = rawMatches[0].toUpperCase();
            console.log(`[searchQRInPDF] ✓ Encontrado en Nivel 2: ${identifier}`);
            return { identifier, debug: `Nivel 2 (Bytes crudos)` };
        }
        debugInfo.push("Nivel 2: No encontrado");

        console.log("[searchQRInPDF] ❌ No se encontró QR Identifier en ningún nivel");
        return { identifier: null, debug: debugInfo.join(" | ") };
    } catch (error) {
        console.error("[searchQRInPDF] Error general:", error);
        return { identifier: null, debug: `Error: ${error}` };
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

        // 2. Buscar QR Identifier en el PDF (formato: DOC-XXXXXXXX-XXXXXXXX)
        const { identifier: qrIdentifier, debug: qrDebug } = await searchQRInPDF(pdfBytes);

        console.log(`[processFile] Debug QR: ${qrDebug}`);

        if (!qrIdentifier) {
            throw new Error(
                `No se encontró código QR (DOC-XXXXXXXX-XXXXXXXX) en el documento. Detalles: ${qrDebug}`,
            );
        }

        console.log(`[processFile] QR Identifier encontrado: ${qrIdentifier}`);

        // 3. Buscar documento por qr_identifier
        const { data: document, error: docError } = await supabase
            .from("signing_documents")
            .select("id, title, organization_id, status, notary_service, qr_identifier, order_id, manager_id, created_by, send_to_signers_on_complete, current_signed_file_path")
            .eq("qr_identifier", qrIdentifier)
            .maybeSingle();

        if (docError || !document) {
            throw new Error(
                `No se encontró documento con QR: ${qrIdentifier}`,
            );
        }

        const documentId = document.id;
        console.log(`[processFile] Documento encontrado: ${documentId} - ${document.title}`);

        // 4. Validar que el documento tiene asignación a esta notaría
        const { data: assignment, error: assignmentError } = await supabase
            .from("signing_notary_assignments")
            .select("id, status")
            .eq("document_id", documentId)
            .eq("notary_office_id", notaryOfficeId)
            .maybeSingle();

        if (assignmentError || !assignment) {
            throw new Error(
                `Documento ${qrIdentifier} no está asignado a esta notaría`,
            );
        }

        if (
            assignment.status !== "pending" &&
            assignment.status !== "in_progress" &&
            assignment.status !== "received" &&
            assignment.status !== "completed"
        ) {
            throw new Error(`Estado inválido para procesar: ${assignment.status}`);
        }

        // 5. Copiar archivo a bucket final (docs-notarized)
        const finalPath =
            `${document.organization_id}/${document.id}/v1/notarized.pdf`;

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

        // 7. Actualizar documento a completed (siempre completed cuando notaría sube)
        const { error: docUpdateError } = await supabase
            .from("signing_documents")
            .update({
                status: "completed",
                completed_at: now,
                updated_at: now,
            })
            .eq("id", document.id);

        if (docUpdateError) {
            throw new Error(`Error actualizando documento: ${docUpdateError.message}`);
        }

        console.log(`[processFile] Order ID para notificacion: ${document.order_id}`);

        // Enviar notificación de pedido completado (si corresponde)
        if (document.order_id) {
            console.log(`[processFile] Iniciando envio de notificacion para orden ${document.order_id}`);
            const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-signing-notification`;
            
            // 1. Obtener versiones del documento (firmado y notariado)
            const { data: versions } = await supabase
                .from("signing_document_versions")
                .select("*")
                .eq("document_id", document.id)
                .in("version_type", ["fully_signed", "notarized"])
                .order("version_number", { ascending: false });

            const signedVersion = versions?.find((v: any) => v.version_type === 'fully_signed');
            const notarizedVersion = versions?.find((v: any) => v.version_type === 'notarized');

            // 2. Generar Signed URLs (60 min validez)
            let signedUrl = "";
            let notarizedUrl = "";

            if (signedVersion?.file_path) {
                const { data } = await supabase.storage
                    .from("docs-signed")
                    .createSignedUrl(signedVersion.file_path, 31536000);
                signedUrl = data?.signedUrl || "";
            } else if (document.current_signed_file_path) {
                const { data } = await supabase.storage
                    .from("docs-signed")
                    .createSignedUrl(document.current_signed_file_path, 31536000);
                signedUrl = data?.signedUrl || "";
            }

            if (notarizedVersion?.file_path) {
                const { data } = await supabase.storage
                    .from("docs-notarized")
                    .createSignedUrl(notarizedVersion.file_path, 31536000);
                notarizedUrl = data?.signedUrl || "";
            }

            // 3. Obtener Gestor
            const managerId = document.manager_id || document.created_by;
            let managerEmail = "";
            let managerName = "Gestor";

            if (managerId) {
                const { data: userData } = await supabase.auth.admin.getUserById(managerId);
                managerEmail = userData?.user?.email || "";
                
                const { data: profileData } = await supabase
                    .from("users") // core.users via public view
                    .select("full_name")
                    .eq("id", managerId)
                    .single();
                managerName = profileData?.full_name || "Gestor";
            }

            // 4. Obtener Firmantes
            const { data: signers } = await supabase
                .from("signing_signers")
                .select("email, full_name")
                .eq("document_id", document.id)
                .neq("status", "removed");

            // 5. Preparar lista de destinatarios
            const recipients = [];

            // Agregar gestor
            if (managerEmail) {
                recipients.push({ email: managerEmail, name: managerName, type: "manager" });
            }

            // Agregar firmantes si corresponde
            if (document.send_to_signers_on_complete && signers) {
                signers.forEach((s: any) => {
                    // Evitar duplicados si el gestor también es firmante
                    if (s.email !== managerEmail) {
                        recipients.push({ email: s.email, name: s.full_name, type: "signer" });
                    }
                });
            }

            // 6. Enviar notificaciones
            for (const recipient of recipients) {
                console.log(`[processFile] Enviando a ${recipient.email} (${recipient.type})`);
                // Usamos await para asegurar que el fetch se complete antes de que la función lambda termine
                await fetch(notificationUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    },
                    body: JSON.stringify({ 
                        type: "ORDER_COMPLETED",
                        recipient_email: recipient.email,
                        recipient_name: recipient.name,
                        document_title: document.title,
                        action_url: `${Deno.env.get("PUBLIC_APP_URL") || "https://tupatrimonio.cl"}/dashboard/signing/documents/${document.id}`,
                        org_id: document.organization_id,
                        document_id: document.id,
                        signed_url: signedUrl,
                        notarized_url: notarizedUrl,
                        has_notary_service: document.notary_service !== 'none'
                    }),
                })
                .then(async (resp) => {
                    if (!resp.ok) {
                        const text = await resp.text();
                        console.error(`[processFile] Error enviando notificación a ${recipient.email}: ${resp.status} - ${text}`);
                    } else {
                        console.log(`[processFile] Notificación enviada a ${recipient.email}`);
                    }
                })
                .catch((err) => console.error('[processFile] Error de red enviando notificacion:', err));
            }
        } else {
            console.warn(`[processFile] No se envia notificacion: documento sin order_id`);
        }

        // 8. Registrar versión en document_versions
        const { data: latestVersion } = await supabase
            .from("signing_document_versions")
            .select("version_number")
            .eq("document_id", document.id)
            .order("version_number", { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

        await supabase.from("signing_document_versions").insert({
            document_id: document.id,
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
            `[processFile] ✓ Documento ${document.title} (${qrIdentifier}) procesado exitosamente`,
        );

        return {
            success: true,
            documentId: document.id,
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
                        status: "matched",
                        detected_document_id: result.documentId,
                        processed_at: new Date().toISOString(),
                    })
                    .eq("id", file.id);
            } else {
                failureCount++;
                await supabase
                    .from("signing_notary_upload_files")
                    .update({
                        status: "error",
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
