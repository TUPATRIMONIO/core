import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/execute-fes
 *
 * Ejecuta la firma electrónica simple (FES) de un documento con API propia
 */
export async function POST(request: NextRequest) {
    try {
        // Usamos Service Role para bypass de RLS ya que es una página pública
        const supabase = createServiceRoleClient();
        const adminClient = supabase;
        const body = await request.json();
        const { signing_token } = body;

        // Validar campos requeridos
        if (!signing_token) {
            return NextResponse.json(
                { error: "signing_token es requerido" },
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

        console.log("=== DEBUG FES: Intentando descargar documento ===");
        console.log("File path:", filePath);

        // Intentar primero en docs-signed, luego en docs-originals
        let fileData: Blob | null = null;
        let downloadErrors: string[] = [];

        for (const bucket of ["docs-signed", "docs-originals"]) {
            console.log(`Intentando descargar de bucket: ${bucket}`);
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

        // 3. Preparar datos para FES API
        // Determinar ID y tipo de ID
        let signerContactId = "";
        let signerTypeContactId = "ID DOC";

        if (signer.rut) {
            signerContactId = signer.rut;
            signerTypeContactId = "RUT"; // Asumimos RUT si está presente
        } else if (signer.metadata?.identifier_value) {
            signerContactId = signer.metadata.identifier_value;
            // Mapear tipo de identificador
            const idType = signer.metadata.identifier_type;
            if (idType === "passport") signerTypeContactId = "PASSPORT";
            else if (idType === "dni") signerTypeContactId = "DNI";
            else signerTypeContactId = "ID DOC";
        } else {
            // Fallback si no hay identificador (no debería pasar si se validó al crear)
            signerContactId = "N/A";
        }

        // 4. Llamar a Edge Function para firmar
        console.log("Invocando fes-signature para:", signer.email);
        
        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "fes-signature",
                {
                    body: {
                        pdf_base64: base64Document,
                        signer_name: signer.full_name,
                        signer_email: signer.email,
                        signer_contact_id: signerContactId,
                        signer_type_contact_id: signerTypeContactId,
                        transaction_id: signer.document.id, // Usamos ID del documento como transacción
                        url_qr: "https://tupatrimon.io/repositorio/", // URL fija por ahora
                    },
                },
            );

        if (invokeError || !result?.success || !result?.data?.pdf_base64) {
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

            console.error("FES Error:", {
                errorDetails,
                fullResult: result,
            });

            return NextResponse.json(
                {
                    success: false,
                    error: "Error al firmar documento con FES",
                    details: errorDetails,
                },
                { status: 500 },
            );
        }

        // 5. Guardar documento firmado
        const signedBase64 = result.data.pdf_base64;
        const transactionId = result.data.transaction_id; // ID retornado por la API

        // Guardar código de transacción
        const { error: updateDocError } = await adminClient
            .from("signing_documents")
            .update({
                provider_transaction_code: transactionId,
            })
            .eq("id", signer.document.id);

        if (updateDocError) {
            console.error("Error actualizando provider_transaction_code:", updateDocError);
        }

        const signedBuffer = Buffer.from(signedBase64, "base64");
        const signedPath = `${signer.document.organization_id}/${signer.document.id}/signed_${Date.now()}.pdf`;

        const { error: uploadError } = await adminClient
            .storage
            .from("docs-signed")
            .upload(signedPath, signedBuffer, {
                contentType: "application/pdf",
                upsert: false,
            });

        if (uploadError) {
            console.error("Error uploading signed document:", uploadError);
            return NextResponse.json(
                {
                    success: false,
                    error: "Error al guardar el documento firmado",
                    details: uploadError.message,
                },
                { status: 500 },
            );
        }

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

        // 6. Actualizar estado del firmante a signed
        const { data: updateResult, error: updateSignerError } = await adminClient
            .rpc("update_signer_status_admin", {
                p_signer_id: signer.id,
                p_status: "signed",
                p_signed_at: new Date().toISOString(),
                p_signature_ip: request.headers.get("x-forwarded-for") ||
                    request.headers.get("x-real-ip") || null,
                p_signature_user_agent: request.headers.get("user-agent") || null,
            });
        
        if (updateSignerError || !updateResult?.success) {
            console.error("Error actualizando estado del firmante a signed:", {
                error: updateSignerError,
                result: updateResult,
                signerId: signer.id,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: "Error al actualizar el estado de la firma. Por favor, recarga la página.",
                    details: updateSignerError?.message || updateResult?.error,
                },
                { status: 500 },
            );
        }
        
        console.log("Firmante FES actualizado exitosamente:", updateResult);

        // 7. Si es firma secuencial, notificar al siguiente firmante
        if (signer.document.signing_order === "sequential") {
            const nextSigner = signer.document.all_signers
                .filter((s: any) => s.signing_order > signer.signing_order)
                .sort((a: any, b: any) =>
                    a.signing_order - b.signing_order
                )[0];

            // Para FES, el siguiente firmante ya debería estar en enrolled si es FES,
            // o needs_enrollment/enrolled si es FEA.
            // La función initiate-signing ya los puso en enrolled si son FES.
            if (nextSigner && (nextSigner.status === "enrolled" || nextSigner.status === "needs_enrollment")) {
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
            codigo_transaccion: transactionId,
        });

    } catch (error: any) {
        console.error("Error en /api/signing/execute-fes:", error);
        return NextResponse.json(
            {
                error: "Error al ejecutar firma FES",
                details: error.message,
            },
            { status: 500 },
        );
    }
}

/**
 * Envía notificación a un firmante (reutilizada de execute/route.ts)
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
