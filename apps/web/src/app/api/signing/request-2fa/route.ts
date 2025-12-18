import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/request-2fa
 *
 * Solicita el envío del código de segundo factor (SMS) por parte de CDS.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signing_token, clave_certificado } = body;

        if (!signing_token || !clave_certificado) {
            return NextResponse.json(
                { error: "signing_token y clave_certificado son requeridos" },
                { status: 400 },
            );
        }

        const supabase = createServiceRoleClient();

        // 1. Obtener firmante y su organización
        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select(`
        *,
        document:signing_documents (
          organization_id
        )
      `)
            .eq("signing_token", signing_token)
            .single();

        if (signerError || !signer) {
            return NextResponse.json(
                { error: "Firmante no encontrado" },
                { status: 404 },
            );
        }

        // 2. Llamar a Edge Function para solicitar 2FA
        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "cds-signature",
                {
                    body: {
                        operation: "request-second-factor",
                        organization_id: signer.document.organization_id,
                        rut: signer.rut,
                        claveCertificado: clave_certificado,
                    },
                },
            );

        if (invokeError || !result.success) {
            console.error(
                "Error al solicitar 2FA CDS:",
                invokeError || result.error,
            );

            const errorCode = result?.data?.errorCode?.toString();
            let errorMessage = result?.error || result?.data?.mensaje ||
                "Error al solicitar segundo factor";

            // Manejo de errores comunes de CDS
            if (errorCode === "122") {
                errorMessage =
                    "Clave de certificado incorrecta. Si falla muchas veces el certificado será bloqueado.";
            } else if (errorCode === "125") {
                errorMessage =
                    "El certificado se encuentra bloqueado por intentos fallidos.";
                // Actualizar estado en BD
                await supabase.from("signing_signers").update({
                    status: "certificate_blocked",
                }).eq("id", signer.id);
            }

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    errorCode,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            message: result.data.mensaje ||
                "Código de segundo factor enviado exitosamente por SMS.",
        });
    } catch (error: any) {
        console.error("Error en /api/signing/request-2fa:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 },
        );
    }
}
