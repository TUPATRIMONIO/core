import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * Webhook que recibe notificaciones de Identyz cuando un firmante
 * completa (o falla) la validación con ClaveÚnica.
 * Consulta el detalle de la validación y actualiza el signer.
 */
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method === "GET") {
        return new Response(
            JSON.stringify({
                status: "ok",
                message: "Identyz webhook operational",
            }),
            {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    }

    if (req.method !== "POST") {
        return new Response("Method not allowed", {
            status: 405,
            headers: corsHeaders,
        });
    }

    try {
        let payload: { docId?: string; id?: string };
        try {
            payload = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const docId = payload.docId;
        const id = payload.id;

        console.log("[identyz-webhook] Recibido:", { docId, id });

        if (!docId) {
            console.warn("[identyz-webhook] Payload sin docId, retornando 200 OK");
            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select("*")
            .eq("claveunica_doc_id", docId)
            .single();

        if (signerError || !signer) {
            console.warn("[identyz-webhook] Signer no encontrado para docId:", docId);
            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let apiKey = Deno.env.get("IDENTYZ_API_KEY");
        if (!apiKey) {
            console.error("[identyz-webhook] IDENTYZ_API_KEY no configurada");
            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Sanitize API Key: remove "Bearer " prefix if present
        if (apiKey.toLowerCase().startsWith("bearer ")) {
            apiKey = apiKey.substring(7).trim();
        }

        const statusResponse = await fetch(
            `https://api.identyz.com/identity/${docId}/status?includeUserInfo=true`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
            },
        );

        if (!statusResponse.ok) {
            console.error("[identyz-webhook] Error consultando status Identyz:", statusResponse.status);
            return new Response(JSON.stringify({ received: true }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const statusData = await statusResponse.json();

        const state = statusData?.state ?? statusData?.status;
        const userInfo = statusData?.user_info ?? statusData?.user_infoCollection ?? statusData?.userInfo;

        if (state === "verified") {
            let verifiedName = userInfo?.name?.trim() || null;
            if (!verifiedName) {
                verifiedName = statusData?.name?.trim() || signer.full_name;
            }

            const verifiedIdentity = statusData?.identity ?? statusData?.run ?? userInfo?.identity ?? userInfo?.run ?? signer.rut;
            const verifiedAt = statusData?.verified_at ?? statusData?.verifiedAt ?? new Date().toISOString();

            const updatePayload = {
                claveunica_status: "verified",
                claveunica_verified_at: verifiedAt,
                claveunica_user_info: statusData,
                confirmed_full_name: verifiedName,
                confirmed_identifier_type: "rut",
                confirmed_identifier_value: verifiedIdentity,
                identity_confirmed_at: verifiedAt,
            };

            const { error: updateError } = await supabase
                .from("signing_signers")
                .update(updatePayload)
                .eq("id", signer.id);

            if (updateError) {
                console.error("[identyz-webhook] Error actualizando signer:", updateError);
            } else {
                console.log("[identyz-webhook] Signer verificado:", signer.id, verifiedName);

                // --- INICIO FIRMA FES AUTOMÁTICA (SERVER-SIDE) ---
                try {
                    console.log("[identyz-webhook] Iniciando firma FES automática para:", signer.id);

                    // 1. Obtener documento
                    const { data: doc, error: docError } = await supabase
                        .from("signing_documents")
                        .select("*")
                        .eq("id", signer.document_id)
                        .single();

                    if (docError || !doc) {
                        throw new Error(`Documento no encontrado: ${docError?.message}`);
                    }

                    // 2. Descargar PDF
                    const filePath = doc.current_signed_file_path || doc.qr_file_path || doc.original_file_path;
                    let fileData: Blob | null = null;

                    for (const bucket of ["docs-signed", "docs-originals"]) {
                        const { data } = await supabase.storage.from(bucket).download(filePath);
                        if (data) {
                            fileData = data;
                            break;
                        }
                    }

                    if (!fileData) {
                        throw new Error(`No se pudo descargar el archivo: ${filePath}`);
                    }

                    const arrayBuffer = await fileData.arrayBuffer();
                    const base64Document = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

                    // 3. Obtener order_number
                    let orderNumber = undefined;
                    if (doc.order_id) {
                        const { data: order } = await supabase
                            .from("orders")
                            .select("order_number")
                            .eq("id", doc.order_id)
                            .single();
                        orderNumber = order?.order_number;
                    }

                    // 4. Llamar a fes-signature
                    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
                    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

                    const fesResp = await fetch(`${supabaseUrl}/functions/v1/fes-signature`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${serviceRoleKey}`,
                        },
                        body: JSON.stringify({
                            pdf_base64: base64Document,
                            signer_name: verifiedName,
                            signer_email: signer.email,
                            signer_contact_id: verifiedIdentity,
                            signer_type_contact_id: "RUT",
                            transaction_id: doc.id,
                            url_qr: "https://tupatrimon.io/repositorio/",
                            order_number: orderNumber,
                        }),
                    });

                    const fesResult = await fesResp.json();

                    if (!fesResp.ok || !fesResult.success) {
                        throw new Error(`Error FES API: ${fesResult.error || JSON.stringify(fesResult)}`);
                    }

                    // 5. Guardar PDF firmado
                    const signedBase64 = fesResult.data.pdf_base64;
                    const transactionId = fesResult.data.transaction_id;
                    const signedBuffer = Uint8Array.from(atob(signedBase64), c => c.charCodeAt(0));
                    const signedPath = `${doc.organization_id}/${doc.id}/signed_${Date.now()}.pdf`;

                    const { error: uploadError } = await supabase.storage
                        .from("docs-signed")
                        .upload(signedPath, signedBuffer, {
                            contentType: "application/pdf",
                            upsert: false,
                        });

                    if (uploadError) throw new Error(`Error subiendo PDF firmado: ${uploadError.message}`);

                    // 6. Actualizar documento
                    await supabase
                        .from("signing_documents")
                        .update({
                            current_signed_file_path: signedPath,
                            provider_transaction_code: transactionId,
                        })
                        .eq("id", doc.id);

                    // 7. Actualizar signer a signed
                    // Usamos RPC si existe, o update directo como fallback (ya tenemos service role)
                    // Para consistencia con execute-fes, intentamos RPC primero
                    const { error: rpcError } = await supabase.rpc("update_signer_status_admin", {
                        p_signer_id: signer.id,
                        p_status: "signed",
                        p_signed_at: new Date().toISOString(),
                        p_signature_ip: "webhook-identyz", // IP genérica para firma server-side
                        p_signature_user_agent: "Identyz Webhook",
                    });

                    if (rpcError) {
                        console.warn("[identyz-webhook] RPC update failed, trying direct update:", rpcError);
                        await supabase
                            .from("signing_signers")
                            .update({
                                status: "signed",
                                signed_at: new Date().toISOString(),
                            })
                            .eq("id", signer.id);
                    }

                    console.log("[identyz-webhook] Firma FES completada exitosamente");

                    // 8. Notificar siguiente firmante (secuencial)
                    if (doc.signing_order === "sequential") {
                        const { data: allSigners } = await supabase
                            .from("signing_signers")
                            .select("*")
                            .eq("document_id", doc.id);
                        
                        if (allSigners) {
                            const nextSigner = allSigners
                                .filter((s: any) => s.signing_order > signer.signing_order)
                                .sort((a: any, b: any) => a.signing_order - b.signing_order)[0];

                            if (nextSigner && (nextSigner.status === "enrolled" || nextSigner.status === "needs_enrollment")) {
                                await fetch(`${supabaseUrl}/functions/v1/send-signing-notification`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${serviceRoleKey}`,
                                    },
                                    body: JSON.stringify({
                                        type: "SIGNING_REQUEST",
                                        recipient_email: nextSigner.email,
                                        recipient_name: nextSigner.full_name,
                                        document_title: doc.title,
                                        action_url: `/sign/${nextSigner.signing_token}`,
                                        org_id: doc.organization_id,
                                        document_id: doc.id,
                                        signer_id: nextSigner.id,
                                    }),
                                });
                            }
                        }
                    }

                } catch (signError: any) {
                    console.error("[identyz-webhook] Error en firma automática:", signError);
                    // No fallamos el webhook, el signer queda en 'verified' y puede reintentar (o implementamos retry luego)
                }
                // --- FIN FIRMA FES AUTOMÁTICA ---
            }
        } else {
            const { error: updateError } = await supabase
                .from("signing_signers")
                .update({
                    claveunica_status: "failed",
                    claveunica_user_info: statusData,
                })
                .eq("id", signer.id);

            if (updateError) {
                console.error("[identyz-webhook] Error marcando failed:", updateError);
            } else {
                console.log("[identyz-webhook] ClaveÚnica no verificada, state:", state);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("[identyz-webhook] Error:", error);
        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
