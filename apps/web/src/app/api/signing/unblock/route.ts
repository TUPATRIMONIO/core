import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/unblock
 *
 * Obtiene la URL de desbloqueo (de certificado o segundo factor) de CDS.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signing_token, type, numDocumento } = body;

        if (!signing_token || !type || !["certificate", "2fa"].includes(type)) {
            return NextResponse.json(
                {
                    error:
                        "signing_token y type ('certificate' o '2fa') son requeridos",
                },
                { status: 400 },
            );
        }

        // numDocumento es requerido por CDS para desbloqueo
        if (!numDocumento || numDocumento.trim() === "") {
            return NextResponse.json(
                {
                    error:
                        "El número de serie de la cédula (numDocumento) es requerido para el desbloqueo",
                },
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

        // 2. Determinar operación
        const operation = type === "certificate"
            ? "unblock-certificate"
            : "unblock-second-factor";

        // 3. Llamar a Edge Function
        const url = new URL(request.url);
        const urlRetorno = `${url.origin}/sign/${signing_token}`;

        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "cds-signature",
                {
                    body: {
                        operation,
                        organization_id: signer.document.organization_id,
                        rut: signer.rut,
                        numDocumento: numDocumento.trim(),
                        urlRetorno,
                    },
                },
            );

        if (invokeError || !result.success) {
            console.error(
                `Error al desbloquear ${type} CDS:`,
                invokeError || result.error,
            );
            return NextResponse.json(
                {
                    success: false,
                    error: result?.error || result?.data?.mensaje ||
                        `Error al solicitar desbloqueo de ${type}`,
                },
                { status: 400 },
            );
        }

        // Verificar si la respuesta de CDS indica un error (success: false en data)
        if (result.data && result.data.success === false) {
            console.error(
                `CDS retornó error para ${type}:`,
                result.data.mensaje || result.data.codigo,
            );
            return NextResponse.json(
                {
                    success: false,
                    error: result.data.mensaje ||
                        `Error de CDS al desbloquear ${type}`,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            url: result.data.url,
            message: result.data.mensaje ||
                `URL de desbloqueo de ${type} generada exitosamente.`,
        });
    } catch (error: any) {
        console.error("Error en /api/signing/unblock:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 },
        );
    }
}
