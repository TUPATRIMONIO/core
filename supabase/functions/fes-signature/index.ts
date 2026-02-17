import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

interface FESRequest {
    pdf_base64: string;
    signer_name: string;
    signer_email: string;
    signer_contact_id: string;
    signer_type_contact_id: string;
    transaction_id: string;
    url_qr: string;
}

interface FESResponse {
    pdf_base64: string;
    transaction_id: string;
    total_firmas: number;
}

serve(async (req) => {
    // Manejo de preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: FESRequest = await req.json();

        // Validar payload requerido
        if (
            !payload.pdf_base64 ||
            !payload.signer_name ||
            !payload.signer_email ||
            !payload.signer_contact_id ||
            !payload.signer_type_contact_id ||
            !payload.transaction_id ||
            !payload.url_qr
        ) {
            throw new Error(
                "Faltan campos requeridos: pdf_base64, signer_name, signer_email, signer_contact_id, signer_type_contact_id, transaction_id, url_qr",
            );
        }

        // Obtener configuración desde variables de entorno
        const fesApiUrl = Deno.env.get("FES_API_URL");
        const fesApiKey = Deno.env.get("FES_API_KEY");

        if (!fesApiUrl || !fesApiKey) {
            throw new Error(
                "Configuración FES incompleta: FES_API_URL o FES_API_KEY no definidos",
            );
        }

        console.log("Enviando solicitud a FES API:", fesApiUrl);
        console.log("Transaction ID:", payload.transaction_id);
        console.log("Signer:", payload.signer_name, payload.signer_email);

        // Llamar a la API externa
        const response = await fetch(fesApiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": fesApiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error FES API:", response.status, errorText);
            throw new Error(
                `Error FES API (${response.status}): ${errorText || response.statusText}`,
            );
        }

        const data: FESResponse = await response.json();

        console.log("Respuesta FES exitosa. Total firmas:", data.total_firmas);

        return new Response(
            JSON.stringify({
                success: true,
                data: data,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    } catch (error: any) {
        console.error("Error en fes-signature:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Error desconocido",
                details: error.stack,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
