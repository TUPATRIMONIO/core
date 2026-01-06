import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/execute
 *
 * Ejecuta la firma electrónica de un documento con CDS
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const adminClient = createServiceRoleClient(); // Para operaciones que requieren bypass de RLS
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

        // Estados que definitivamente NO pueden firmar (no cambian externamente)
        if (signer.status === "needs_enrollment") {
            return NextResponse.json(
                {
                    error:
                        "Debe completar su proceso de enrolamiento antes de poder firmar.",
                    errorCode: "NEEDS_ENROLLMENT",
                },
                { status: 400 },
            );
        }

        // Para certificate_blocked y sf_blocked, PERMITIR el intento de firma.
        // CDS determinará si realmente están bloqueados o si el usuario ya los desbloqueó.
        // Si CDS retorna error de bloqueo, el estado se actualizará apropiadamente.
        // Esto evita el problema de estados desactualizados en la base de datos.

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

        console.log("=== DEBUG: Intentando descargar documento ===");
        console.log("File path:", filePath);
        console.log(
            "current_signed_file_path:",
            signer.document.current_signed_file_path,
        );
        console.log("qr_file_path:", signer.document.qr_file_path);
        console.log("original_file_path:", signer.document.original_file_path);

        // Intentar primero en docs-originals, luego en docs-signed
        let fileData: Blob | null = null;
        let downloadErrors: string[] = [];

        for (const bucket of ["docs-originals", "docs-signed"]) {
            console.log(`Intentando descargar de bucket: ${bucket}`);
            // Usar adminClient para bypass de RLS (firmantes externos sin autenticación)
            const result = await adminClient.storage.from(bucket).download(
                filePath,
            );
            if (!result.error && result.data) {
                console.log(`✓ Archivo encontrado en ${bucket}`);
                fileData = result.data;
                break;
            } else {
                console.log(`✗ Error en ${bucket}:`, result.error?.message);
                downloadErrors.push(`${bucket}: ${result.error?.message}`);
            }
        }

        if (!fileData) {
            console.error(
                "No se pudo descargar el archivo de ningún bucket:",
                downloadErrors,
            );
            return NextResponse.json(
                {
                    error:
                        `No se pudo obtener el archivo del documento. Ruta: ${filePath}`,
                    details: downloadErrors.join("; "),
                },
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

        if (invokeError || !result?.success || !result?.data?.success) {
            let errorDetails = invokeError?.message || result?.error || "Error desconocido";
            
            // Si es un FunctionsHttpError, intentar extraer el body del error
            if (invokeError && 'context' in invokeError && (invokeError as any).context instanceof Response) {
                try {
                    const response = (invokeError as any).context as Response;
                    const errorBody = await response.clone().json();
                    errorDetails = errorBody.error || errorBody.details || JSON.stringify(errorBody);
                } catch (e) {
                    console.error("Error al parsear body de error de Edge Function:", e);
                }
            }

            // Manejar errores específicos de CDS
            const errorCode = result?.data?.codigo || result?.data?.errorCode;

            // SIEMPRE usar comentarios de CDS para máxima transparencia
            const cdsComentarios = result?.data?.comentarios ||
                result?.data?.mensaje;
            let errorMessage = cdsComentarios || errorDetails ||
                "Error al firmar documento";

            console.log("CDS Error:", {
                errorCode,
                comentarios: cdsComentarios,
                estado: result?.data?.estado,
                errorDetails,
                fullResult: result,
            });

            // Actualizar estado en BD según código de error
            if (
                errorCode === "122" || errorCode === 122 ||
                errorCode === "123" || errorCode === 123 ||
                errorCode === "125" || errorCode === 125
            ) {
                const { error: updateError } = await adminClient
                    .from("signing_signers")
                    .update({ status: "certificate_blocked" })
                    .eq("id", signer.id);
                
                if (updateError) {
                    console.error("Error actualizando estado a certificate_blocked:", updateError);
                }
            } else if (errorCode === "134" || errorCode === 134) {
                const { error: updateError } = await adminClient
                    .from("signing_signers")
                    .update({ status: "sf_blocked" })
                    .eq("id", signer.id);
                
                if (updateError) {
                    console.error("Error actualizando estado a sf_blocked:", updateError);
                }
            }

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    cdsComentarios: cdsComentarios, // Incluir para debug
                    errorCode: errorCode,
                    estado: result?.data?.estado,
                },
                { status: 400 },
            );
        }

        // 4. Guardar código de transacción y actualizar estado
        const { error: updateDocError } = await adminClient
            .from("signing_documents")
            .update({
                provider_transaction_code: result.data.codigoTransaccion,
            })
            .eq("id", signer.document.id);

        if (updateDocError) {
            console.error("Error actualizando provider_transaction_code:", updateDocError);
        }

        // 5. Si CDS retorna el documento firmado inmediatamente, guardarlo
        // CDS retorna "documentoFirmado" (singular) como string base64 según documentación
        const signedBase64 = result.data.documentoFirmado;

        console.log("CDS Sign Success:", {
            estado: result.data?.estado,
            transaccion: result.data?.transaccion,
            codigoTransaccion: result.data?.codigoTransaccion,
            hasDocumentoFirmado: !!signedBase64,
            documentLength: signedBase64?.length,
        });

        if (signedBase64) {
            const signedBuffer = Buffer.from(signedBase64, "base64");

            // Guardar en storage
            const signedPath =
                `${signer.document.organization_id}/${signer.document.id}/signed_${Date.now()}.pdf`;

            const { error: uploadError } = await adminClient
                .storage
                .from("docs-signed")
                .upload(signedPath, signedBuffer, {
                    contentType: "application/pdf",
                    upsert: false,
                });

            if (uploadError) {
                console.error("Error uploading signed document:", uploadError);
            } else {
                // Actualizar ruta del archivo firmado
                const { error: updatePathError } = await adminClient
                    .from("signing_documents")
                    .update({
                        current_signed_file_path: signedPath,
                    })
                    .eq("id", signer.document.id);
                
                if (updatePathError) {
                    console.error("Error actualizando current_signed_file_path:", updatePathError);
                }
            }

            // Actualizar estado del firmante
            const { error: updateSignerError } = await adminClient
                .from("signing_signers")
                .update({
                    status: "signed",
                    signed_at: new Date().toISOString(),
                    signature_ip: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip"),
                    signature_user_agent: request.headers.get("user-agent"),
                })
                .eq("id", signer.id);
            
            if (updateSignerError) {
                console.error("Error actualizando estado del firmante a signed:", updateSignerError);
                // Si falla la actualización del firmante, retornar error para que el frontend lo maneje
                return NextResponse.json(
                    {
                        success: false,
                        error: "Error al actualizar el estado de la firma. Por favor, recarga la página.",
                        details: updateSignerError.message,
                    },
                    { status: 500 },
                );
            }

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
                message: result.data?.comentarios ||
                    "Documento firmado exitosamente",
                signed: true,
                codigo_transaccion: result.data.transaccion ||
                    result.data.codigoTransaccion,
            });
        }

        // Si CDS no retorna el documento inmediatamente, marcar como "signing" y esperar webhook
        const { error: updateSigningError } = await adminClient
            .from("signing_signers")
            .update({
                status: "signing",
            })
            .eq("id", signer.id);
        
        if (updateSigningError) {
            console.error("Error actualizando estado del firmante a signing:", updateSigningError);
        }

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
