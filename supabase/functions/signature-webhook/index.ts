import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

/**
 * Webhook para recibir notificaciones de CDS sobre el estado de las firmas
 *
 * CDS puede enviar notificaciones cuando:
 * - Un documento es firmado exitosamente
 * - Un firmante rechaza firmar
 * - Hay un error en el proceso de firma
 */
serve(async (req) => {
    // Manejo de preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Permitir GET para validación de health check (CDS, browsers)
        if (req.method === "GET") {
            return new Response(
                JSON.stringify({
                    status: "ok",
                    message: "Webhook operational",
                }),
                {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Verificar método POST
        if (req.method !== "POST") {
            return new Response("Method not allowed", {
                status: 405,
                headers: corsHeaders,
            });
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Obtener payload del webhook
        let payload;
        try {
            payload = await req.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: corsHeaders,
            });
        }

        console.log(
            "CDS Webhook payload received:",
            JSON.stringify(payload, null, 2),
        );

        // ... (check signature code left commented out)

        // Extraer información del payload
        const {
            codigoTransaccion,
            estado,
            mensaje,
            documentos,
            firmantes,
            rut,
            correo,
        } = payload;

        if (!codigoTransaccion) {
            // Check for Enrolment Notification (RUT + Fecha only, no transaction)
            if (rut && payload.fecha && !estado) {
                console.log("Enrolment notification received for:", rut);

                // Actualizar todos los firmantes con este RUT que estaban esperando enrolamiento
                const { data: updatedSigners, error: updateError } =
                    await supabaseClient
                        .from("signing_signers")
                        .update({
                            status: "enrolled",
                            fea_vigente: true,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("rut", rut)
                        .in("status", ["needs_enrollment", "pending"]);

                if (updateError) {
                    console.error(
                        "Error updating signers status on enrolment:",
                        updateError,
                    );
                } else {
                    console.log(
                        `Updated signers for RUT ${rut} to enrolled status`,
                    );
                }

                return new Response("OK", {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" },
                });
            }

            console.warn(
                "Transaction code missing in webhook payload - treating as validation ping",
            );
            // Respondemos 200 OK para pasar validación de CDS si envían ping sin código
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Validation ping received",
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        // Handle Simple Flow Notification (Transaccion + RUT + Fecha, no estado)
        if (codigoTransaccion && rut && payload.fecha && !estado) {
            console.log(
                "Simple Flow Signing Notification received:",
                codigoTransaccion,
            );

            // Find document
            const { data: document, error: docError } = await supabaseClient
                .from("signing_documents")
                .select(`*, signers:signing_signers(*)`)
                .eq("provider_transaction_code", codigoTransaccion)
                .single();

            if (docError || !document) {
                console.warn(
                    "Document not found for Simple Flow transaction:",
                    codigoTransaccion,
                );
                // Return OK to CDS so it doesn't retry indefinitely
                return new Response("OK", {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "text/plain" },
                });
            }

            // Find signer
            const signer = document.signers.find((s: any) => s.rut === rut);
            if (signer) {
                await supabaseClient
                    .from("signing_signers")
                    .update({
                        status: "signed",
                        signed_at: new Date().toISOString(),
                    })
                    .eq("id", signer.id);

                // Check if all signed to update document status?
                // (Existing logic handles sequential, but Simple Flow might be different.
                //  For now, we just mark the signer. The existing logic handled 'sequential' notifications.)
            }

            return new Response("OK", {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "text/plain" },
            });
        }

        // Buscar documento por código de transacción
        const { data: document, error: docError } = await supabaseClient
            .from("signing_documents")
            .select(`
        *,
        signers:signing_signers(*)
      `)
            .eq("provider_transaction_code", codigoTransaccion)
            .single();

        if (docError || !document) {
            console.warn(
                "Document not found for transaction (ignoring for validation success):",
                codigoTransaccion,
            );
            // IMPORTANTE: Devolvemos 200 OK en lugar de 404 porque CDS valida la URL esperando 200.
            // Si devolvemos 404, el enrolamiento falla.
            return new Response(
                JSON.stringify({
                    success: true,
                    warning: "Document not found, but acknowledged",
                }),
                {
                    status: 200, // <--- Cambio clave: 200 OK
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        let result: any = {
            message: "Webhook processed",
            transaction_code: codigoTransaccion,
        };

        // Procesar según el estado
        if (estado === "FIRMADO" || estado === "SIGNED" || estado === "0") {
            // Firma exitosa
            console.log("Processing successful signature");

            // Si el webhook incluye el documento firmado en base64
            if (documentos && documentos.length > 0) {
                const signedDoc = documentos[0];
                const signedBase64 = signedDoc.base64 || signedDoc.contenido;

                if (signedBase64) {
                    // Convertir base64 a buffer
                    const base64Data = signedBase64.replace(
                        /^data:application\/pdf;base64,/,
                        "",
                    );
                    const binaryData = Uint8Array.from(
                        atob(base64Data),
                        (c) => c.charCodeAt(0),
                    );

                    // Guardar en storage
                    const signedPath =
                        `${document.organization_id}/${document.id}/signed_${Date.now()}.pdf`;

                    const { error: uploadError } = await supabaseClient
                        .storage
                        .from("docs-signed")
                        .upload(signedPath, binaryData, {
                            contentType: "application/pdf",
                            upsert: false,
                        });

                    if (!uploadError) {
                        // Actualizar ruta del archivo firmado en el documento
                        await supabaseClient
                            .from("signing_documents")
                            .update({
                                current_signed_file_path: signedPath,
                            })
                            .eq("id", document.id);
                    } else {
                        console.error(
                            "Error uploading signed document:",
                            uploadError,
                        );
                    }
                }
            }

            // Identificar el firmante por RUT o email
            let signer = null;
            if (rut) {
                signer = document.signers.find((s: any) => s.rut === rut);
            } else if (correo) {
                signer = document.signers.find((s: any) => s.email === correo);
            }

            if (signer) {
                // Actualizar estado del firmante
                await supabaseClient
                    .from("signing_signers")
                    .update({
                        status: "signed",
                        signed_at: new Date().toISOString(),
                    })
                    .eq("id", signer.id);

                result.signer_updated = true;
                result.signer_id = signer.id;

                // Si es firma secuencial, notificar al siguiente firmante
                if (document.signing_order === "sequential") {
                    const nextSigner = document.signers
                        .filter((s: any) =>
                            s.signing_order > signer.signing_order
                        )
                        .sort((a: any, b: any) =>
                            a.signing_order - b.signing_order
                        )[0];

                    if (nextSigner && nextSigner.status === "enrolled") {
                        // Enviar notificación al siguiente firmante
                        await sendSigningNotification(
                            supabaseClient,
                            document,
                            nextSigner,
                        );
                        result.next_signer_notified = true;
                    }
                }
            }

            result.action = "signature_completed";
        } else if (estado === "RECHAZADO" || estado === "REJECTED") {
            // Firma rechazada
            console.log("Processing rejected signature");

            // Identificar el firmante
            let signer = null;
            if (rut) {
                signer = document.signers.find((s: any) => s.rut === rut);
            } else if (correo) {
                signer = document.signers.find((s: any) => s.email === correo);
            }

            if (signer) {
                await supabaseClient
                    .from("signing_signers")
                    .update({
                        status: "rejected",
                        rejected_at: new Date().toISOString(),
                        rejection_reason: mensaje || "Firmante rechazó firmar",
                    })
                    .eq("id", signer.id);

                result.signer_updated = true;
                result.signer_id = signer.id;
            }

            // Actualizar estado del documento
            await supabaseClient
                .from("signing_documents")
                .update({
                    status: "rejected",
                })
                .eq("id", document.id);

            result.action = "signature_rejected";
        } else if (estado === "ERROR") {
            // Error en el proceso
            console.error("Error in signature process:", mensaje);
            result.action = "signature_error";
            result.error_message = mensaje;
        }

        // Guardar log del webhook (opcional pero recomendado)
        const { error: logError } = await supabaseClient
            .from("signing_webhook_logs")
            .insert({
                document_id: document?.id, // document might be null if validation ping
                provider: "cds",
                transaction_code: codigoTransaccion,
                payload: payload,
                status: estado,
                processed_at: new Date().toISOString(),
            });

        if (logError) {
            console.warn("Failed to log webhook:", logError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                ...result,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Unknown error",
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});

/**
 * Envía notificación de firma a un firmante
 */
async function sendSigningNotification(
    supabase: any,
    document: any,
    signer: any,
) {
    try {
        const appUrl = Deno.env.get("PUBLIC_APP_URL") ||
            "https://tupatrimonio.cl";
        const signUrl = `${appUrl}/sign/${signer.signing_token}`;

        const notificationUrl = `${
            Deno.env.get("SUPABASE_URL")
        }/functions/v1/send-signing-notification`;

        await fetch(notificationUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${
                    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
                }`,
            },
            body: JSON.stringify({
                type: "SIGNING_REQUEST",
                recipient_email: signer.email,
                recipient_name: signer.full_name,
                document_title: document.title,
                action_url: signUrl,
                org_id: document.organization_id,
                document_id: document.id,
                signer_id: signer.id,
            }),
        });

        console.log(`Notificación enviada a ${signer.email}`);
    } catch (error) {
        console.error(`Error enviando notificación a ${signer.email}:`, error);
    }
}
