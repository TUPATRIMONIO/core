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

        // 2. Generar portada con QR (OBLIGATORIO - Pero no bloqueante)
        console.log(
            "[initiate-signing] Generando portada con QR para documento:",
            documentId,
            document.qr_file_path ? "(regenerando)" : ""
        );

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
                        force_regenerate: Boolean(document.qr_file_path),
                    }),
                }
            );

            const coverResult = await coverResponse.json();

            if (!coverResult.success && !coverResult.skipped) {
                console.error("[initiate-signing] Error generando portada (no bloqueante):", coverResult.error);
                // No retornamos error, solo logueamos
            } else {
                console.log("[initiate-signing] Portada generada exitosamente:", coverResult.path);
            }
        } catch (coverError: any) {
            console.error("[initiate-signing] Error llamando a pdf-merge-with-cover (no bloqueante):", coverError);
            // No retornamos error, solo logueamos
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

        // 5. Notificaciones:
        // El envío de correos es manejado automáticamente por el trigger de base de datos
        // 'notify_signers_on_status_change' cuando el estado cambia a 'pending_signature'.
        // No enviamos correos desde aquí para evitar duplicados.

        return {
            success: true,
            message: "Proceso de firma iniciado",
            document_id: documentId,
            signers_status: signersStatus,
            next_steps: "Notificaciones enviadas automáticamente a firmantes",
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


