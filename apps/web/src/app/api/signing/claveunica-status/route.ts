import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/signing/claveunica-status?token=<signing_token>
 * Usado para polling del estado de validación ClaveÚnica desde el portal de firma.
 */
export async function GET(request: NextRequest) {
    try {
        const token = request.nextUrl.searchParams.get("token");
        if (!token) {
            return NextResponse.json(
                { error: "Token de firma requerido" },
                { status: 400 },
            );
        }

        const supabase = createServiceRoleClient();

        const { data: signer, error } = await supabase
            .from("signing_signers")
            .select(
                "claveunica_status, confirmed_full_name, confirmed_identifier_value, status",
            )
            .eq("signing_token", token)
            .single();

        if (error || !signer) {
            return NextResponse.json(
                { error: "Token inválido o expirado" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            status: signer.claveunica_status || "none",
            signer_status: signer.status,
            verified_name: signer.confirmed_full_name || null,
            verified_rut: signer.confirmed_identifier_value || null,
        });
    } catch (err: unknown) {
        console.error("Error en claveunica-status:", err);
        return NextResponse.json(
            { error: "Error al consultar estado" },
            { status: 500 },
        );
    }
}
