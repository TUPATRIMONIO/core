import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { compareSignerWithVeriff, extractVeriffData } from "@/lib/signing/identity-match";

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
        const { 
            signing_token,
            confirmed_name,
            confirmed_id_type,
            confirmed_id_value,
            signature_image,
            client_ip
        } = body;

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

        const productSlug = signer.document?.metadata?.signature_product?.slug || "";
        let finalConfirmedName = confirmed_name;
        let finalConfirmedIdType = confirmed_id_type;
        let finalConfirmedIdValue = confirmed_id_value;

        if (productSlug === "fes_claveunica_cl") {
            if (signer.claveunica_status !== "verified") {
                return NextResponse.json(
                    {
                        error: "Debe completar la validación con ClaveÚnica antes de firmar",
                    },
                    { status: 400 },
                );
            }
            finalConfirmedName = signer.confirmed_full_name;
            finalConfirmedIdValue = signer.confirmed_identifier_value;
            finalConfirmedIdType = "rut";
        }

        // 2.5 Si se requiere Veriff, obtener datos de la sesión para estampa
        const requireVeriff = signer.document?.metadata?.require_veriff_identity === true;
        
        if (requireVeriff) {
            if (!signer.identity_verification_id) {
                 return NextResponse.json(
                    { error: "Se requiere verificación de identidad pero no se encontró ninguna asociada" },
                    { status: 400 }
                );
            }

            const { data: session } = await adminClient
                .from('identity_verification_sessions')
                .select('status, raw_response')
                .eq('id', signer.identity_verification_id)
                .single();
            
            if (!session || session.status !== 'approved') {
                return NextResponse.json(
                    { error: "La verificación de identidad requerida no está aprobada" },
                    { status: 400 }
                );
            }

            // Validar coincidencia de identidad
            const veriffData = extractVeriffData(session.raw_response);
            const identityMatch = compareSignerWithVeriff(signer, veriffData);
            if (!identityMatch.overallMatch) {
                console.warn("Bloqueo de firma por no coincidencia de identidad:", {
                    signerId: signer.id,
                    matchResult: identityMatch
                });
                return NextResponse.json(
                    { error: "La identidad verificada no coincide con los datos del firmante. Por favor contacte al remitente." },
                    { status: 400 }
                );
            }

            // Extraer datos de Veriff para la estampa
            const person = veriffData.person;
            const document = veriffData.document;
            
            if (person) {
                const firstName = person.firstName || "";
                const lastName = person.lastName || "";
                finalConfirmedName = `${firstName} ${lastName}`.trim();
                
                // Identificador: Preferir idNumber de persona, luego número de documento
                const idNumber = person.idNumber || document?.number;
                if (idNumber) {
                    finalConfirmedIdValue = idNumber;
                    
                    // Mapear tipo de documento
                    const docType = document?.type;
                    if (docType === 'PASSPORT') {
                        finalConfirmedIdType = 'passport';
                    } else if (docType === 'DRIVERS_LICENSE') {
                        finalConfirmedIdType = 'other'; // O lo que corresponda
                    } else {
                        // ID_CARD o similar
                        // Heurística simple para RUT vs DNI si no está explícito
                        finalConfirmedIdType = idNumber.includes('-') ? 'rut' : 'dni';
                    }
                }
            }
            
            console.log("Usando datos de Veriff para firma FES:", { finalConfirmedName, finalConfirmedIdValue });
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
        // Determinar ID y tipo de ID (usar confirmados si existen)
        let signerContactId = "";
        let signerTypeContactId = "ID DOC";
        const finalName = finalConfirmedName || signer.full_name;

        // Prioridad: datos confirmados > datos en BD
        if (finalConfirmedIdValue) {
            signerContactId = finalConfirmedIdValue;
            // Mapear tipo confirmado
            if (finalConfirmedIdType === "rut") signerTypeContactId = "RUT";
            else if (finalConfirmedIdType === "passport") signerTypeContactId = "PASSPORT";
            else if (finalConfirmedIdType === "dni") signerTypeContactId = "DNI";
            else signerTypeContactId = "ID DOC";
        } else if (signer.rut) {
            signerContactId = signer.rut;
            signerTypeContactId = "RUT";
        } else if (signer.metadata?.identifier_value) {
            signerContactId = signer.metadata.identifier_value;
            const idType = signer.metadata.identifier_type;
            if (idType === "passport") signerTypeContactId = "PASSPORT";
            else if (idType === "dni") signerTypeContactId = "DNI";
            else signerTypeContactId = "ID DOC";
        } else {
            signerContactId = "N/A";
        }

        // 4. Llamar a Edge Function para firmar
        console.log("Invocando fes-signature para:", signer.email);
        
        // Obtener order_number si existe
        let orderNumber = undefined;
        if (signer.document.order_id) {
            const { data: order } = await adminClient
                .from("orders")
                .select("order_number")
                .eq("id", signer.document.order_id)
                .single();
            if (order) {
                orderNumber = order.order_number;
            }
        }

        // Usar IP confirmada o headers
        const finalIp = client_ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");

        const { data: result, error: invokeError } = await supabase.functions
            .invoke(
                "fes-signature",
                {
                    body: {
                        pdf_base64: base64Document,
                        signer_name: finalName,
                        signer_email: signer.email,
                        signer_contact_id: signerContactId,
                        signer_type_contact_id: signerTypeContactId,
                        // Opcionales
                        ip: finalIp,
                        order_number: orderNumber,
                        transaction_id: signer.document.id, // Usamos ID del documento como transacción
                        url_qr: "https://tupatrimon.io/repositorio/", // URL fija por ahora
                        // coords deshabilitado temporalmente - la API FES espera 2 valores, no 4
                        // page_sign: signer.use_custom_coordinates ? signer.signature_page : undefined,
                        // coords: signer.use_custom_coordinates ? [
                        //     signer.coord_x_lower_left,
                        //     signer.coord_y_lower_left,
                        //     signer.coord_x_upper_right,
                        //     signer.coord_y_upper_right,
                        // ] : undefined,
                        signature_image_base64: signature_image 
                            ? signature_image.replace(/^data:image\/\w+;base64,/, '') 
                            : undefined,
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

        // 5.5 Guardar firma manuscrita si existe
        let signaturePath = null;
        if (signature_image) {
            try {
                const signatureBuffer = Buffer.from(signature_image.replace(/^data:image\/png;base64,/, ''), 'base64');
                const sigPath = `${signer.document.organization_id}/${signer.document.id}/signatures/handwritten_${signer.id}_${Date.now()}.png`;
                
                const { error: sigUploadError } = await adminClient
                    .storage
                    .from("docs-signed")
                    .upload(sigPath, signatureBuffer, {
                        contentType: "image/png",
                        upsert: false
                    });
                
                if (!sigUploadError) {
                    signaturePath = sigPath;
                } else {
                    console.error("Error uploading handwritten signature:", sigUploadError);
                }
            } catch (e) {
                console.error("Error processing handwritten signature:", e);
            }
        }

        // 6. Actualizar estado del firmante a signed
        const { data: updateResult, error: updateSignerError } = await adminClient
            .rpc("update_signer_status_admin", {
                p_signer_id: signer.id,
                p_status: "signed",
                p_signed_at: new Date().toISOString(),
                p_signature_ip: finalIp,
                p_signature_user_agent: request.headers.get("user-agent") || null,
            });
        
        if (updateSignerError || !updateResult?.success) {
            console.error("Error actualizando estado del firmante a signed:", {
                error: updateSignerError,
                result: updateResult,
                signerId: signer.id,
            });
            // No retornamos error aquí porque el documento ya se firmó y guardó
        } else {
             // 6.5 Actualizar datos confirmados (para fes_claveunica_cl ya vienen del webhook)
            const { error: confirmError } = await adminClient
                .from("signing_signers")
                .update({
                    confirmed_full_name: finalConfirmedName || null,
                    confirmed_identifier_type: finalConfirmedIdType || null,
                    confirmed_identifier_value: finalConfirmedIdValue || null,
                    identity_confirmed_at: new Date().toISOString(),
                    handwritten_signature_path: signaturePath,
                    client_ip: finalIp
                })
                .eq("id", signer.id);

            if (confirmError) {
                console.error("Error saving confirmed identity data:", confirmError);
            }
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
