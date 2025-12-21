import {
    createClient,
    SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { processPromptVariables } from "../_shared/prompt-variables.ts";

// Configuración CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function _getBearerToken(req: Request) {
    const auth = req.headers.get("authorization") || "";
    const [type, token] = auth.split(" ");
    if (type?.toLowerCase() !== "bearer" || !token) return null;
    return token;
}

async function getCreditCost(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from("credit_prices")
        .select("credit_cost")
        .eq("service_code", "ai_editor_assistance")
        .maybeSingle();

    if (error) {
        console.warn("[getCreditCost] Error, using fallback:", error.message);
        return 2;
    }

    return Number(data?.credit_cost ?? 2);
}

async function reserveCredits(
    supabase: SupabaseClient,
    organizationId: string,
    amount: number,
    documentId: string,
) {
    const { data, error } = await supabase.rpc("reserve_credits", {
        org_id_param: organizationId,
        amount_param: amount,
        service_code_param: "ai_editor_assistance",
        reference_id_param: documentId,
        description_param: "Asistente de IA en editor",
    });

    if (error || !data) {
        throw new Error(
            `Créditos insuficientes o error reservando créditos: ${error?.message}`,
        );
    }

    return data as string; // transaction_id
}

async function confirmCredits(
    supabase: SupabaseClient,
    organizationId: string,
    transactionId: string,
) {
    const { error } = await supabase.rpc("confirm_credits", {
        org_id_param: organizationId,
        transaction_id_param: transactionId,
    });

    if (error) {
        console.warn("[confirmCredits] Error:", error.message);
    }
}

async function releaseCredits(
    supabase: SupabaseClient,
    organizationId: string,
    transactionId: string,
) {
    const { error } = await supabase.rpc("release_credits", {
        org_id_param: organizationId,
        transaction_id_param: transactionId,
    });

    if (error) {
        console.warn("[releaseCredits] Error:", error.message);
    }
}

async function getActivePrompt(
    supabase: SupabaseClient,
    countryCode: string,
) {
    const { data, error } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("feature_type", "editor_assistance")
        .eq("country_code", countryCode)
        .eq("is_active", true)
        .single();

    if (error || !data) {
        // Fallback global
        const { data: fallback } = await supabase
            .from("ai_prompts")
            .select("*")
            .eq("feature_type", "editor_assistance")
            .eq("country_code", "ALL")
            .eq("is_active", true)
            .single();

        return fallback;
    }

    return data;
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let creditTxId: string | null = null;
    let organizationId: string | null = null;

    try {
        const payload = await req.json().catch(() => ({}));
        const {
            document_id,
            document_content,
            selected_text,
            user_instruction,
            country_code = "CL",
        } = payload;

        if (!document_id || !user_instruction) {
            return jsonResponse(400, {
                success: false,
                error: "document_id y user_instruction son requeridos",
            });
        }

        // 1) Obtener organización del documento para créditos
        console.log(`[document-ai-assistant] Fetching doc ${document_id}`);
        const { data: orgData, error: docError } = await supabase.rpc(
            "get_document_organization_id",
            { p_document_id: document_id },
        );

        if (docError || !orgData) {
            console.error("[document-ai-assistant] Doc error:", docError);
            throw new Error(
                `No se pudo encontrar el documento o su organización: ${
                    docError?.message || "Documento no encontrado"
                }`,
            );
        }

        organizationId = orgData;
        console.log(`[document-ai-assistant] Org found: ${organizationId}`);

        // 2) Reservar créditos
        const creditCost = await getCreditCost(supabase);
        creditTxId = await reserveCredits(
            supabase,
            organizationId!,
            creditCost,
            document_id,
        );

        // 3) Obtener prompt
        const promptConfig = await getActivePrompt(supabase, country_code);
        if (!promptConfig) {
            throw new Error(
                "No hay prompt configurado para el asistente del editor",
            );
        }

        // 4) Procesar variables
        // El shared processPromptVariables es limitado, hacemos reemplazos manuales para editor
        let systemPrompt = promptConfig.system_prompt;
        let userPrompt = promptConfig.user_prompt_template;

        const replacements = {
            "{{document_content}}": document_content || "Vacío",
            "{{selected_text}}": selected_text || "Ninguno",
            "{{user_instruction}}": user_instruction,
        };

        for (const [key, value] of Object.entries(replacements)) {
            userPrompt = userPrompt.split(key).join(value);
        }

        // Usar el default para otras variables como current_date
        systemPrompt = processPromptVariables(systemPrompt, { country_code });
        userPrompt = processPromptVariables(userPrompt, { country_code });

        // 5) Llamar a Claude
        const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
        if (!anthropicApiKey) {
            throw new Error("ANTHROPIC_API_KEY no configurada");
        }

        const resp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: promptConfig.ai_model || "claude-3-5-sonnet-20241022",
                max_tokens: promptConfig.max_tokens || 4000,
                temperature: promptConfig.temperature || 0.5,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userPrompt,
                    },
                ],
            }),
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(
                "[document-ai-assistant] Claude API Error:",
                errorText,
            );
            throw new Error(`Error de Claude: ${errorText}`);
        }

        const data = await resp.json();
        const resultText = data.content?.[0]?.text || "";

        // 6) Confirmar créditos
        await confirmCredits(supabase, organizationId!, creditTxId);

        return jsonResponse(200, {
            success: true,
            suggestion: resultText,
            usage: data.usage,
            model: data.model,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : String(error);
        console.error("[document-ai-assistant] Error:", error);

        if (creditTxId && organizationId) {
            await releaseCredits(supabase, organizationId, creditTxId);
        }

        return jsonResponse(500, {
            success: false,
            error: errorMessage,
        });
    }
});
