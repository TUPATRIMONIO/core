import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/enroll
 *
 * Enrola un firmante nuevo en CDS para obtener su FEA
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const {
            signer_id,
            rut,
            nombres,
            apellido_paterno,
            apellido_materno,
            correo,
            numero_documento,
            nacionalidad = "CL",
            clave_certificado, // Opcional
        } = body;

        // Validar campos requeridos
        if (
            !signer_id || !rut || !nombres || !apellido_paterno || !correo ||
            !numero_documento
        ) {
            return NextResponse.json(
                {
                    error:
                        "Campos requeridos: signer_id, rut, nombres, apellido_paterno, correo, numero_documento",
                },
                { status: 400 },
            );
        }

        // 1. Obtener firmante y documento
        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select("*, document:signing_documents(*)")
            .eq("id", signer_id)
            .single();

        if (signerError || !signer) {
            return NextResponse.json(
                { error: "Firmante no encontrado" },
                { status: 404 },
            );
        }

        // 2. Llamar a Edge Function para enrolar
        const edgeFunctionUrl =
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cds-signature`;

        console.log("Llamando a Edge Function:", edgeFunctionUrl); // DEBUG

        const response = await fetch(edgeFunctionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                operation: "enroll",
                organization_id: signer.document.organization_id,
                rut,
                nombres,
                apellidoPaterno: apellido_paterno,
                apellidoMaterno: apellido_materno,
                correo,
                numeroDocumento: numero_documento,
                nacionalidad,
                claveCertificado: clave_certificado,
            }),
        });

        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const textResponse = await response.text();
            console.error("Respuesta no JSON de Edge Function:", textResponse);
            return NextResponse.json(
                {
                    error:
                        "Error de comunicación con el servicio de firma (Edge Function)",
                    details: `Status: ${response.status}. Response: ${
                        textResponse.substring(0, 200)
                    }...`,
                },
                { status: response.status >= 400 ? response.status : 500 },
            );
        }

        if (!result.success || !result.data?.success) {
            console.error("Error en resultado de Edge Function:", result);
            const errorMessage = result.data?.mensaje || result.error ||
                "Error al enrolar firmante";
            const errorCode = result.data?.codigo;
            const fullError = errorCode
                ? `${errorMessage} (Código CDS: ${errorCode})`
                : errorMessage;

            return NextResponse.json(
                {
                    success: false,
                    error: fullError,
                    details: JSON.stringify(result.data || result),
                    codigo: errorCode,
                },
                { status: 400 },
            );
        }

        // 3. Actualizar estado del firmante a 'enrolled'
        const { error: updateError } = await supabase
            .from("signing_signers")
            .update({
                status: "enrolled",
                fea_vigente: true,
                // Actualizar datos del firmante si fueron modificados
                full_name: `${nombres} ${apellido_paterno} ${
                    apellido_materno || ""
                }`.trim(),
                rut,
                email: correo,
            })
            .eq("id", signer_id);

        if (updateError) {
            throw updateError;
        }

        // 4. Verificar vigencia inmediatamente después de enrolar
        const vigenciaResponse = await fetch(edgeFunctionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                operation: "check-vigencia",
                organization_id: signer.document.organization_id,
                rut,
            }),
        });

        const vigenciaResult = await vigenciaResponse.json();

        if (vigenciaResult.success && vigenciaResult.data.vigente) {
            await supabase
                .from("signing_signers")
                .update({
                    fea_fecha_vencimiento: vigenciaResult.data.fechaVencimiento,
                })
                .eq("id", signer_id);
        }

        return NextResponse.json({
            success: true,
            message: "Firmante enrolado exitosamente",
            signer_id,
            enrolled: true,
            vigente: vigenciaResult.data?.vigente || false,
            fecha_vencimiento: vigenciaResult.data?.fechaVencimiento,
        });
    } catch (error: any) {
        console.error("Error en /api/signing/enroll:", error);
        return NextResponse.json(
            {
                error: "Error al enrolar firmante",
                details: error.message,
            },
            { status: 500 },
        );
    }
}
