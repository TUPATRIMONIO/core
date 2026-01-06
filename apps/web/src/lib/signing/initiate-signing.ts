import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Inicia el proceso de firma de un documento:
 * 1. Valida que el documento existe y está listo
 * 2. Genera portada con QR (si no existe)
 * 3. Verifica vigencia FEA de cada firmante
 * 4. Actualiza estado del documento a 'pending_signature'
 * 5. Envía notificaciones a firmantes
 */
export async function initiateSigningProcess(
    supabase: SupabaseClient,
    documentId: string
) {
    try {
        // 1. Obtener documento
        const { data: document, error: docError } = await supabase
            .from("signing_documents")
            .select("*, signers:signing_signers(*)")
            .eq("id", documentId)
            .single();

        if (docError || !document) {
            return { success: false, error: "Documento no encontrado", status: 404 };
        }

        // Validar que el documento está en un estado válido para iniciar firma
        const validStatuses = ["draft", "approved", "manual_review"];
        if (!validStatuses.includes(document.status)) {
            return { 
                success: false, 
                error: `El documento debe estar en estado 'draft', 'approved' o 'manual_review' para iniciar firma. Estado actual: ${document.status}`,
                status: 400 
            };
        }

        // Validar que tiene firmantes
        if (!document.signers || document.signers.length === 0) {
            return { success: false, error: "El documento debe tener al menos un firmante", status: 400 };
        }

        // 2. Generar portada con QR (OBLIGATORIO)
        if (!document.qr_file_path) {
            console.log("[initiate-signing] Generando portada con QR para documento:", documentId);
            
            try {
                const coverResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pdf-merge-with-cover`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        },
                        body: JSON.stringify({
                            document_id: documentId,
                        }),
                    }
                );

                const coverResult = await coverResponse.json();
                
                if (!coverResult.success && !coverResult.skipped) {
                    console.error("[initiate-signing] Error generando portada:", coverResult.error);
                    return {
                        success: false,
                        error: "No se pudo generar la portada del documento.",
                        details: coverResult.error,
                        status: 500
                    };
                }
                
                console.log("[initiate-signing] Portada generada exitosamente:", coverResult.path);
            } catch (coverError: any) {
                console.error("[initiate-signing] Error llamando a pdf-merge-with-cover:", coverError);
                return {
                    success: false,
                    error: "Error al generar la portada del documento.",
                    details: coverError.message,
                    status: 500
                };
            }
        }

        // 3. Verificar vigencia FEA de cada firmante
        const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cds-signature`;
        const signersStatus = [];

        for (const signer of document.signers) {
            try {
                // Solo verificar firmantes chilenos con RUT
                if (!signer.is_foreigner && signer.rut) {
                    const response = await fetch(edgeFunctionUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                        },
                        body: JSON.stringify({
                            operation: "check-vigencia",
                            organization_id: document.organization_id,
                            rut: signer.rut,
                        }),
                    });

                    const result = await response.json();

                    if (result.success && result.data.vigente) {
                        // Tiene FEA vigente
                        await supabase
                            .from("signing_signers")
                            .update({
                                status: "enrolled",
                                fea_vigente: true,
                                fea_fecha_vencimiento: result.data.fechaVencimiento,
                            })
                            .eq("id", signer.id);

                        signersStatus.push({
                            signer_id: signer.id,
                            email: signer.email,
                            status: "enrolled",
                            needs_enrollment: false,
                        });
                    } else {
                        // No tiene FEA vigente, necesita enrolamiento
                        await supabase
                            .from("signing_signers")
                            .update({
                                status: "needs_enrollment",
                                fea_vigente: false,
                            })
                            .eq("id", signer.id);

                        signersStatus.push({
                            signer_id: signer.id,
                            email: signer.email,
                            status: "needs_enrollment",
                            needs_enrollment: true,
                        });
                    }
                } else {
                    // Firmante extranjero - flujo diferente
                    signersStatus.push({
                        signer_id: signer.id,
                        email: signer.email,
                        status: "pending",
                        needs_enrollment: false,
                        note: "Firmante extranjero - flujo pendiente de implementación",
                    });
                }
            } catch (error: any) {
                console.error(`Error verificando firmante ${signer.id}:`, error);
                signersStatus.push({
                    signer_id: signer.id,
                    email: signer.email,
                    status: "error",
                    error: error.message,
                });
            }
        }

        // 4. Actualizar estado del documento
        const { error: updateError } = await supabase
            .from("signing_documents")
            .update({
                status: "pending_signature",
                sent_to_sign_at: new Date().toISOString(),
            })
            .eq("id", documentId);

        if (updateError) {
            throw updateError;
        }

        // 5. Enviar notificaciones a firmantes enrolados
        const enrolledSigners = signersStatus.filter((s) => s.status === "enrolled");

        if (enrolledSigners.length > 0) {
            // Recargar firmantes para tener los estados actualizados
            const { data: updatedSigners } = await supabase
                .from("signing_signers")
                .select("*")
                .eq("document_id", documentId);

            if (updatedSigners) {
                if (document.signing_order === "sequential") {
                    const firstSigner = updatedSigners
                        .sort((a: any, b: any) => a.signing_order - b.signing_order)[0];

                    if (firstSigner && firstSigner.status === "enrolled") {
                        await sendSigningNotification(supabase, document, firstSigner);
                    }
                } else {
                    for (const signer of updatedSigners) {
                        if (signer.status === "enrolled") {
                            await sendSigningNotification(supabase, document, signer);
                        }
                    }
                }
            }
        }

        return {
            success: true,
            message: "Proceso de firma iniciado",
            document_id: documentId,
            signers_status: signersStatus,
            next_steps: signersStatus.some((s) => s.needs_enrollment)
                ? "Algunos firmantes necesitan enrolamiento FEA"
                : "Notificaciones enviadas a firmantes",
        };
    } catch (error: any) {
        console.error("Error in initiateSigningProcess:", error);
        return {
            success: false,
            error: "Error al iniciar proceso de firma",
            details: error.message,
            status: 500
        };
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
        const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signer.signing_token}`;
        const notificationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-signing-notification`;

        await fetch(notificationUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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

