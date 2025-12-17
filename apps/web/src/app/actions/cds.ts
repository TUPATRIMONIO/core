"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

interface CDSResponse {
    success: boolean;
    operation?: string;
    data?: any;
    error?: string;
    [key: string]: any;
}

/**
 * Generic action to call CDS Edge Function
 */
export async function invokeCDSOperation(
    operation: string,
    payload: any,
): Promise<CDSResponse> {
    try {
        const supabase = createServiceRoleClient();

        // We need an organization_id for the CDS Config
        // For admin panel, we can try to find a default 'TuPatrimonio' org,
        // or rely on the payload providing it if the UI allows selection.
        // If payload doesn't have it, fetch a fallback.

        let organization_id = payload.organization_id;

        if (!organization_id) {
            // Fallback: Find the organization that has CDS configured
            const { data: config, error } = await supabase
                .from("signing_provider_configs")
                .select("organization_id")
                .eq("is_active", true)
                .limit(1)
                .single();

            if (config) {
                organization_id = config.organization_id;
            } else {
                return {
                    success: false,
                    error: "No active CDS configuration found in database.",
                };
            }
        }

        const { data, error } = await supabase.functions.invoke(
            "cds-signature",
            {
                body: {
                    operation,
                    organization_id,
                    ...payload,
                },
            },
        );

        if (error) {
            console.error("CDS Invoke Error:", error);
            return {
                success: false,
                error: error.message || "Error invoking Edge Function",
            };
        }

        // The edge function returns standard JSON response
        return data;
    } catch (err: any) {
        console.error("Server Action Error:", err);
        return {
            success: false,
            error: err.message || "Internal Server Error",
        };
    }
}
