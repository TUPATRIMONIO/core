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
