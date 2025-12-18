import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/execute
 *
 * Ejecuta la firma electrónica de un documento con CDS
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const {
            signing_token,
            clave_fea,
            codigo_segundo_factor, // Opcional
        } = body;

        // Validar campos requeridos
        if (!signing_token || !clave_fea) {
            return NextResponse.json(
                { error: "signing_token y clave_fea son requeridos" },
                { status: 400 },
            );
        }

        // 1. Obtener firmante por token
        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select(`
        *,
        document:signing_documents(
          *,
          provider:signing_providers(*),
          all_signers:signing_signers(*)
        )
      `)
            .eq("signing_token", signing_token)
            .single();

        if (signerError || !signer) {
            return NextResponse.json(
                { error: "Token de firma inválido o expirado" },
                { status: 404 },
            );
        }

        // Validar que el token no haya expirado
        if (new Date(signer.token_expires_at) < new Date()) {
            return NextResponse.json(
                { error: "El token de firma ha expirado" },
                { status: 400 },
            );
        }

        // Validar que el firmante está en estado correcto
        if (signer.status === "signed") {
            return NextResponse.json(
                { error: "Este documento ya ha sido firmado por usted" },
                { status: 400 },
            );
        }

        if (signer.status !== "enrolled" && signer.status !== "pending") {
            return NextResponse.json(
                {
                    error:
                        `No puede firmar en el estado actual: ${signer.status}. Debe estar 'enrolled' o 'pending'`,
                },
                { status: 400 },
            );
        }

        // Si es firma secuencial, verificar que es su turno
        if (signer.document.signing_order === "sequential") {
            const previousSigners = signer.document.all_signers.filter(
                (s: any) => s.signing_order < signer.signing_order,
            );

            const allPreviousSigned = previousSigners.every(
                (s: any) => s.status === "signed",
            );

            if (!allPreviousSigned) {
                return NextResponse.json(
                    {
                        error:
                            "Aún no es su turno para firmar. Debe esperar a que los firmantes anteriores completen su firma.",
                    },
                    { status: 400 },
                );
            }
        }

        // 2. Obtener archivo PDF desde Storage (docs-originals o docs-signed si ya tiene firmas)
        const filePath = signer.document.current_signed_file_path ||
            signer.document.qr_file_path ||
            signer.document.original_file_path;

        // Intentar primero en docs-originals, luego en docs-signed
        let fileData: Blob | null = null;
        for (const bucket of ["docs-originals", "docs-signed"]) {
            const result = await supabase.storage.from(bucket).download(
                filePath,
            );
            if (!result.error && result.data) {
                fileData = result.data;
                break;
            }
        }

        if (!fileData) {
            return NextResponse.json(
                { error: "No se pudo obtener el archivo del documento" },
                { status: 500 },
            );
        }

        // Convertir a Base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Document = Buffer.from(arrayBuffer).toString("base64");

        // 3. Llamar a Edge Function para firmar
        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "cds-signature",
                {
                    body: {
                        operation: "sign-multiple",
                        organization_id: signer.document.organization_id,
                        rut: signer.rut,
                        claveCertificado: clave_fea, // Mapeamos clave_fea a claveCertificado
                        segundoFactor: codigo_segundo_factor, // Mapeamos codigo_segundo_factor a segundoFactor
                        documento: base64Document,
                        nombreDocumento: signer.document.original_file_name,
                        qr: !!signer.document.qr_file_path,
                        traeCoordenadas: signer.use_custom_coordinates,
                        pag: signer.signature_page,
                        coordenadaXInferiorIzquierda: signer.coord_x_lower_left,
                        coordenadaYInferiorIzquierda: signer.coord_y_lower_left,
                        coordenadaXSuperiorDerecha: signer.coord_x_upper_right,
                        coordenadaYSuperiorDerecha: signer.coord_y_upper_right,
                    },
                },
            );

        if (invokeError || !result.success || !result.data.success) {
            // Manejar errores específicos de CDS
            const errorCode = result.data?.codigo;
            let errorMessage = result.data?.mensaje || result.error ||
                "Error al firmar documento";

            // Errores comunes
            if (errorCode === "122") {
                errorMessage =
                    "Máximo de intentos de clave FEA alcanzado. El certificado ha sido bloqueado.";
                await supabase
                    .from("signing_signers")
                    .update({ status: "certificate_blocked" })
                    .eq("id", signer.id);
            } else if (errorCode === "124") {
                errorMessage = "La clave FEA ingresada es incorrecta.";
            } else if (errorCode === "127") {
                errorMessage = "El código de segundo factor es incorrecto.";
            } else if (errorCode === "134") {
                errorMessage =
                    "El segundo factor está bloqueado. Contacte a soporte.";
                await supabase
                    .from("signing_signers")
                    .update({ status: "sf_blocked" })
                    .eq("id", signer.id);
            }

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    codigo: errorCode,
                },
                { status: 400 },
            );
        }

        // 4. Guardar código de transacción y actualizar estado
        const { error: updateDocError } = await supabase
            .from("signing_documents")
            .update({
                provider_transaction_code: result.data.codigoTransaccion,
            })
            .eq("id", signer.document.id);

        if (updateDocError) {
            console.error("Error actualizando documento:", updateDocError);
        }

        // 5. Si CDS retorna el documento firmado inmediatamente, guardarlo
        if (
            result.data.documentosFirmados &&
            result.data.documentosFirmados.length > 0
        ) {
            const signedBase64 = result.data.documentosFirmados[0].base64;
            const signedBuffer = Buffer.from(signedBase64, "base64");

            // Guardar en storage
            const signedPath =
                `${signer.document.organization_id}/${signer.document.id}/signed_${Date.now()}.pdf`;

            const { error: uploadError } = await supabase
                .storage
                .from("docs-signed")
                .upload(signedPath, signedBuffer, {
                    contentType: "application/pdf",
                    upsert: false,
                });

            if (!uploadError) {
                // Actualizar ruta del archivo firmado
                await supabase
                    .from("signing_documents")
                    .update({
                        current_signed_file_path: signedPath,
                    })
                    .eq("id", signer.document.id);
            }

            // Actualizar estado del firmante
            await supabase
                .from("signing_signers")
                .update({
                    status: "signed",
                    signed_at: new Date().toISOString(),
                    signature_ip: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip"),
                    signature_user_agent: request.headers.get("user-agent"),
                })
                .eq("id", signer.id);

            // Si es firma secuencial, notificar al siguiente firmante
            if (signer.document.signing_order === "sequential") {
                const nextSigner = signer.document.all_signers
                    .filter((s: any) => s.signing_order > signer.signing_order)
                    .sort((a: any, b: any) =>
                        a.signing_order - b.signing_order
                    )[0];

                if (nextSigner && nextSigner.status === "enrolled") {
                    await sendSigningNotification(
                        supabase,
                        signer.document,
                        nextSigner,
                    );
                }
            }

            return NextResponse.json({
                success: true,
                message: "Documento firmado exitosamente",
                signed: true,
                codigo_transaccion: result.data.codigoTransaccion,
            });
        }

        // Si CDS no retorna el documento inmediatamente, marcar como "signing" y esperar webhook
        await supabase
            .from("signing_signers")
            .update({
                status: "signing",
            })
            .eq("id", signer.id);

        return NextResponse.json({
            success: true,
            message:
                "Firma en proceso. Recibirá una notificación cuando esté completada.",
            codigo_transaccion: result.data.codigoTransaccion,
            pending_webhook: true,
        });
    } catch (error: any) {
        console.error("Error en /api/signing/execute:", error);
        return NextResponse.json(
            {
                error: "Error al ejecutar firma",
                details: error.message,
            },
            { status: 500 },
        );
    }
}

/**
 * Envía notificación a un firmante
 */
async function sendSigningNotification(
    supabase: any,
    document: any,
    signer: any,
) {
    try {
        const signUrl =
            `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signer.signing_token}`;

        const notificationUrl =
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-signing-notification`;

        await fetch(notificationUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization":
                    `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                type: "SIGNING_REQUEST",
                recipient_email: signer.email,
                recipient_name: signer.full_name,
                document_title: document.title,
                action_url: signUrl,
                org_id: document.organization_id,
                document_id: document.id,
                signer_id: signer.id,
            }),
        });
    } catch (error) {
        console.error(`Error enviando notificación a ${signer.email}:`, error);
    }
}
