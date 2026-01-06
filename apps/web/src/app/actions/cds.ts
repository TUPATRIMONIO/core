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
 * Las credenciales ahora se leen desde variables de entorno en la Edge Function
 */
export async function invokeCDSOperation(
    operation: string,
    payload: any,
): Promise<CDSResponse> {
    try {
        const supabase = createServiceRoleClient();

        // organization_id ya no es necesario para obtener credenciales
        // Se mantiene en el payload solo si viene para compatibilidad
        const { data, error } = await supabase.functions.invoke(
            "cds-signature",
            {
                body: {
                    operation,
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
