import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: GET /api/signing/check-fea?token=...
 *
 * Verifica la vigencia de la Firma Electrónica Avanzada (FEA) de un firmante con CDS.
 * Se usa Service Role porque es una consulta pública protegida por el signing_token.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { error: "Token es requerido" },
                { status: 400 },
            );
        }

        const supabase = createServiceRoleClient();

        // 1. Obtener firmante y su configuración de proveedor
        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select(`
        *,
        document:signing_documents (
          organization_id
        )
      `)
            .eq("signing_token", token)
            .single();

        if (signerError || !signer) {
            return NextResponse.json(
                { error: "Firmante no encontrado" },
                { status: 404 },
            );
        }

        if (!signer.rut) {
            return NextResponse.json(
                { error: "El firmante no tiene un RUT asociado" },
                { status: 400 },
            );
        }

        // 2. Llamar a Edge Function para verificar vigencia
        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "cds-signature",
                {
                    body: {
                        operation: "check-vigencia",
                        organization_id: signer.document.organization_id,
                        rut: signer.rut,
                    },
                },
            );

        if (invokeError || !result.success) {
            console.error(
                "Error al verificar vigencia CDS:",
                invokeError || result.error,
            );
            return NextResponse.json(
                {
                    error: "No se pudo verificar la vigencia con el proveedor",
                    details: invokeError?.message || result?.error ||
                        "Error desconocido",
                },
                { status: 500 },
            );
        }

        const cdsData = result.data;

        // 3. Actualizar estado del firmante en la base de datos
        // IMPORTANTE: Verificar bloqueo ANTES de verificar vigencia
        // Un certificado bloqueado puede tener vigente=false, pero no necesita enrolamiento
        let status = signer.status;

        if (cdsData.certificadoBloqueado) {
            status = "certificate_blocked";
        } else if (!cdsData.vigente) {
            // Solo si NO está bloqueado Y no es vigente, necesita enrolamiento
            status = "needs_enrollment";
        } else if (
            signer.status === "needs_enrollment" || signer.status === "pending"
        ) {
            // Si antes necesitaba enrolamiento y ahora es vigente, pasar a enrolled
            status = "enrolled";
        }

        const { error: updateError } = await supabase
            .from("signing_signers")
            .update({
                status,
                fea_vigente: cdsData.vigente,
                fea_fecha_vencimiento: cdsData.fechaVencimiento,
                certificate_blocked: cdsData.certificadoBloqueado,
                updated_at: new Date().toISOString(),
            })
            .eq("id", signer.id);

        if (updateError) {
            console.error(
                "Error al actualizar firmante post-vigencia:",
                updateError,
            );
        }

        return NextResponse.json({
            success: true,
            vigente: cdsData.vigente,
            fechaVencimiento: cdsData.fechaVencimiento,
            certificadoBloqueado: cdsData.certificadoBloqueado,
            status,
            // Transparencia: incluir respuesta de CDS
            cdsComentarios: cdsData.mensaje || cdsData.comentarios,
            cdsEstado: cdsData.estado,
            vigencia: cdsData.vigencia, // Mensaje descriptivo de CDS (e.g. "Certificado bloqueado")
        });
    } catch (error: any) {
        console.error("Error en /api/signing/check-fea:", error);
        return NextResponse.json(
            { error: "Error interno del servidor", details: error.message },
            { status: 500 },
        );
    }
}
