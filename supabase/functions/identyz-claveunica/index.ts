import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * Genera SHA256 en hexadecimal
 */
async function sha256Hex(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Crea una solicitud de validación ClaveÚnica en Identyz.
 * Llamado durante la iniciación del proceso de firma cuando el producto es fes_claveunica_cl.
 */
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Método no permitido" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    try {
        const apiKey = Deno.env.get("IDENTYZ_API_KEY");
        const webhookSecretSuffix = Deno.env.get("IDENTYZ_WEBHOOK_SECRET_SUFFIX");
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const publicAppUrl = Deno.env.get("PUBLIC_APP_URL") || "https://tupatrimonio.cl";

        if (!apiKey) {
            throw new Error("IDENTYZ_API_KEY no configurada");
        }
        if (!supabaseUrl) {
            throw new Error("SUPABASE_URL no configurada");
        }

        const body = await req.json();
        const {
            signer_id,
            signer_rut,
            signer_name,
            document_id,
            signing_token,
        } = body;

        if (!signer_id || !signer_rut || !signer_name || !document_id || !signing_token) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Faltan campos requeridos: signer_id, signer_rut, signer_name, document_id, signing_token",
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const idInput = `${signer_rut.replace(/\s/g, "").replace(/\./g, "")}-${document_id}`;
        const requestId = await sha256Hex(idInput);
        const secret = webhookSecretSuffix
            ? `${requestId}${webhookSecretSuffix}`
            : requestId;

        const redirectUri = `${publicAppUrl.replace(/\/$/, "")}/sign/${signing_token}?claveunica=completed`;
        const webhookUrl = `${supabaseUrl}/functions/v1/identyz-webhook`;

        const identyzPayload = [
            {
                method: "claveunica",
                id: requestId,
                identity: signer_rut,
                name: signer_name,
                redirect_uri: redirectUri,
                notifications: [
                    {
                        type: "webhook",
                        url: webhookUrl,
                        id: requestId,
                        secret,
                    },
                ],
            },
        ];

        console.log("[identyz-claveunica] Enviando solicitud a Identyz para signer:", signer_id);

        const identyzResponse = await fetch("https://api.identyz.com/identity/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(identyzPayload),
        });

        if (!identyzResponse.ok) {
            const errorText = await identyzResponse.text();
            console.error("[identyz-claveunica] Error Identyz API:", identyzResponse.status, errorText);
            throw new Error(`Identyz API error (${identyzResponse.status}): ${errorText}`);
        }

        const identyzData = await identyzResponse.json();

        const signerURL = identyzData?.signerURL ?? identyzData?.[0]?.signerURL;
        const docId = identyzData?.docId ?? identyzData?.[0]?.docId;

        if (!signerURL || !docId) {
            console.error("[identyz-claveunica] Respuesta Identyz sin signerURL o docId:", identyzData);
            throw new Error("Identyz no retornó signerURL ni docId");
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const { error: updateError } = await supabase
            .from("signing_signers")
            .update({
                claveunica_doc_id: docId,
                claveunica_request_id: requestId,
                claveunica_status: "pending",
                claveunica_signer_url: signerURL,
            })
            .eq("id", signer_id);

        if (updateError) {
            console.error("[identyz-claveunica] Error actualizando signer:", updateError);
            throw new Error(`Error guardando en BD: ${updateError.message}`);
        }

        console.log("[identyz-claveunica] Solicitud creada exitosamente. docId:", docId);

        return new Response(
            JSON.stringify({
                success: true,
                signerURL,
                docId,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("[identyz-claveunica] Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Error desconocido",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
