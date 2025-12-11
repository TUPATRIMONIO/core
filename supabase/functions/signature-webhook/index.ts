import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Manejo de preflight request
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verificar método
        if (req.method !== "POST") {
            throw new Error("Method not allowed");
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        // Obtener payload del webhook
        // Nota: El formato real del webhook de CDS debe ser verificado en la documentación.
        // Asumiremos una estructura genérica basada en la práctica común y la documentación previa.
        // Estructura esperada (ejemplo):
        // {
        //   "codigoTransaccion": "...",
        //   "estado": "FIRMADO" | "RECHAZADO" | "ERROR",
        //   "firmantes": [...],
        //   "documentoUrl": "...",
        //   "metadata": { "signing_token": "..." }
        // }

        const payload = await req.json();
        console.log("Webhook payload received:", payload);

        // Identificar el documento o firmante
        // Dependiendo de cómo CDS envíe los identifiers.
        // Si enviamos el 'signing_token' en algún campo de referencia o metadata a CDS, lo buscamos aquí.
        // Asumamos que tenemos 'external_id' o similar que mapea a nuestro 'signing_token' o 'transaction_code'.

        const transactionCode = payload.codigoTransaccion ||
            payload.transactionId;

        if (!transactionCode) {
            // Si no hay código de transacción, intentamos buscar por metadata si existe
            // throw new Error('Transaction code missing in payload')
            console.warn("Transaction code missing, logging payload for debug");
        }

        // Lógica para procesar diferentes eventos
        let result = { message: "Webhook processed", action: "none" };

        if (payload.estado === "FIRMADO" || payload.status === "SIGNED") {
            // Buscar documento por transaction code
            const { data: doc, error: docError } = await supabaseClient
                .from("documents")
                .select("id")
                .eq("provider_transaction_code", transactionCode)
                .single();

            if (doc) {
                // Actualizar estado del documento o firmante
                // Aquí idealmente llamaríamos a la RPC `record_signature` si tenemos el token del firmante específico
                // O actualizamos el documento completo si ya viene todo firmado.

                // Si CDS nos devuelve el documento final firmado:
                if (payload.documentoUrl || payload.fileUrl) {
                    // Descargar y guardar documento final
                    // TODO: Implementar descarga de URL externa y subida a Supabase
                }

                result.action = "updated_signed";
            }
        } else if (
            payload.estado === "RECHAZADO" || payload.status === "REJECTED"
        ) {
            // Manejar rechazo
            result.action = "updated_rejected";
        }

        // Registrar el evento en logs (opcional, crear tabla webhook_logs si es necesario debugging)

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});
