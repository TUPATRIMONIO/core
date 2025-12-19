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

        console.log(
            "CDS request-2fa response:",
            JSON.stringify(result, null, 2),
        );

        // Verificar errores de invocación O si CDS retorna FAIL/success:false
        const cdsError = invokeError ||
            !result?.success ||
            result?.data?.success === false ||
            result?.data?.estado === "FAIL";

        if (cdsError) {
            console.error(
                "Error al solicitar 2FA CDS:",
                invokeError || result?.error || result?.data,
            );

            // CDS puede retornar el código de error en diferentes lugares
            const errorCode = (
                result?.data?.errorCode ||
                result?.data?.codigo ||
                result?.errorCode
            )?.toString();

            // SIEMPRE usar el comentario de CDS si está disponible
            const cdsComentarios = result?.data?.comentarios ||
                result?.data?.mensaje;

            // Si CDS da un mensaje, usarlo directamente para máxima transparencia
            let errorMessage = cdsComentarios ||
                "Error al solicitar segundo factor";

            // Solo actualizar estado en BD para casos específicos
            if (
                errorCode === "122" || errorCode === "125" ||
                errorCode === "123"
            ) {
                await supabase.from("signing_signers").update({
                    status: "certificate_blocked",
                }).eq("id", signer.id);
            }

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    cdsComentarios: cdsComentarios, // Siempre incluir para debug
                    errorCode,
                    estado: result?.data?.estado,
                },
                { status: 400 },
            );
        }

        // En éxito, actualizar estado si estaba en un estado bloqueado
        // Esto asegura que el estado se sincronice cuando el usuario desbloquea externamente
        if (
            signer.status === "certificate_blocked" ||
            signer.status === "sf_blocked" || signer.status === "pending"
        ) {
            await supabase
                .from("signing_signers")
                .update({ status: "enrolled" })
                .eq("id", signer.id);
        }

        // También mostrar el comentario de CDS
        return NextResponse.json({
            success: true,
            message: result.data?.comentarios || result.data?.mensaje ||
                "Código de segundo factor enviado exitosamente por SMS.",
            cdsComentarios: result.data?.comentarios,
        });
    } catch (error: any) {
        console.error("Error en /api/signing/request-2fa:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 },
        );
    }
}
