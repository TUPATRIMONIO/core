import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/enroll-cds
 *
 * Inicia el proceso de enrolamiento en CDS.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signing_token, send_email = true } = body;

        if (!signing_token) {
            return NextResponse.json(
                { error: "signing_token es requerido" },
                { status: 400 },
            );
        }

        const supabase = createServiceRoleClient();

        // 1. Obtener firmante
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

        // 2. Llamar a Edge Function para enrolar
        const url = new URL(request.url);
        const urlRetorno = `${url.origin}/sign/${signing_token}`;

        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "cds-signature",
                {
                    body: {
                        operation: "enroll",
                        organization_id: signer.document.organization_id,
                        rut: signer.rut,
                        correo: signer.email,
                        enviaCorreo: send_email,
                        urlRetorno,
                        extranjero: false, // Por defecto ciudadano chileno
                    },
                },
            );

        console.log("CDS enroll response:", JSON.stringify(result, null, 2));

        // Verificar errores - incluir estado FAIL de CDS
        const cdsError = invokeError ||
            !result?.success ||
            result?.data?.success === false ||
            result?.data?.estado === "FAIL";

        if (cdsError) {
            console.error(
                "Error al enrolar CDS:",
                invokeError || result?.error || result?.data,
            );

            // SIEMPRE usar comentarios de CDS para transparencia
            const cdsComentarios = result?.data?.comentarios ||
                result?.data?.mensaje;
            const errorMessage = cdsComentarios || result?.error ||
                "Error al iniciar enrolamiento";

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    cdsComentarios: cdsComentarios,
                    errorCode: result?.data?.errorCode,
                    estado: result?.data?.estado,
                },
                { status: 400 },
            );
        }

        // 3. Actualizar estado a 'needs_enrollment' si no lo estaba
        if (signer.status !== "needs_enrollment") {
            await supabase
                .from("signing_signers")
                .update({ status: "needs_enrollment" })
                .eq("id", signer.id);
        }

        // Obtener mensaje de CDS o construir uno descriptivo
        const cdsComentarios = result.data?.comentarios || result.data?.mensaje;

        return NextResponse.json({
            success: true,
            message: cdsComentarios ||
                "Proceso de enrolamiento iniciado exitosamente.",
            cdsComentarios: cdsComentarios,
            estado: result.data?.estado,
            enrollment_url: result.data?.url ||
                result.data?.debug_data?.estadoEnrolado?.[0]?.url,
        });
    } catch (error: any) {
        console.error("Error en /api/signing/enroll-cds:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 },
        );
    }
}
