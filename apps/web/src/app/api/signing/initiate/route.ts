import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/initiate
 *
 * Inicia el proceso de firma de un documento:
 * 1. Valida que el documento existe y está listo
 * 2. Verifica vigencia FEA de cada firmante
 * 3. Actualiza estado del documento a 'pending_signature'
 * 4. Envía notificaciones a firmantes
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { document_id } = body;

        if (!document_id) {
            return NextResponse.json(
                { error: "document_id es requerido" },
                { status: 400 },
            );
        }

        // 1. Obtener documento
        const { data: document, error: docError } = await supabase
            .from("signing_documents")
            .select("*, signers:signing_signers(*)")
            .eq("id", document_id)
            .single();

        if (docError || !document) {
            return NextResponse.json(
                { error: "Documento no encontrado" },
                { status: 404 },
            );
        }

        // Validar que el documento está en un estado válido para iniciar firma
        const validStatuses = ["draft", "approved"];
        if (!validStatuses.includes(document.status)) {
            return NextResponse.json(
                {
                    error:
                        `El documento debe estar en estado 'draft' o 'approved' para iniciar firma. Estado actual: ${document.status}`,
                },
                { status: 400 },
            );
        }

        // Validar que tiene firmantes
        if (!document.signers || document.signers.length === 0) {
            return NextResponse.json(
                { error: "El documento debe tener al menos un firmante" },
                { status: 400 },
            );
        }

        // 2. Verificar vigencia FEA de cada firmante
        const edgeFunctionUrl =
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cds-signature`;
        const signersStatus = [];

        for (const signer of document.signers) {
            try {
                // Solo verificar firmantes chilenos con RUT
                if (!signer.is_foreigner && signer.rut) {
                    const response = await fetch(edgeFunctionUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization":
                                `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
                                fea_fecha_vencimiento:
                                    result.data.fechaVencimiento,
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
                    // Firmante extranjero - flujo diferente (por ahora marcar como pendiente)
                    signersStatus.push({
                        signer_id: signer.id,
                        email: signer.email,
                        status: "pending",
                        needs_enrollment: false,
                        note:
                            "Firmante extranjero - flujo pendiente de implementación",
                    });
                }
            } catch (error: any) {
                console.error(
                    `Error verificando firmante ${signer.id}:`,
                    error,
                );
                signersStatus.push({
                    signer_id: signer.id,
                    email: signer.email,
                    status: "error",
                    error: error.message,
                });
            }
        }

        // 3. Actualizar estado del documento
        const { error: updateError } = await supabase
            .from("signing_documents")
            .update({
                status: "pending_signature",
                sent_to_sign_at: new Date().toISOString(),
            })
            .eq("id", document_id);

        if (updateError) {
            throw updateError;
        }

        // 4. Enviar notificaciones a firmantes enrolados
        // Solo enviar a firmantes que están listos para firmar (enrolled)
        const enrolledSigners = signersStatus.filter((s) =>
            s.status === "enrolled"
        );

        if (enrolledSigners.length > 0) {
            // Si es firma secuencial, solo enviar al primero
            if (document.signing_order === "sequential") {
                const firstSigner = document.signers
                    .sort((a: any, b: any) =>
                        a.signing_order - b.signing_order
                    )[0];

                if (firstSigner && firstSigner.status === "enrolled") {
                    await sendSigningNotification(
                        supabase,
                        document,
                        firstSigner,
                    );
                }
            } else {
                // Firma simultánea - enviar a todos los enrolados
                for (const signer of document.signers) {
                    if (signer.status === "enrolled") {
                        await sendSigningNotification(
                            supabase,
                            document,
                            signer,
                        );
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Proceso de firma iniciado",
            document_id,
            signers_status: signersStatus,
            next_steps: signersStatus.some((s) => s.needs_enrollment)
                ? "Algunos firmantes necesitan enrolamiento FEA"
                : "Notificaciones enviadas a firmantes",
        });
    } catch (error: any) {
        console.error("Error en /api/signing/initiate:", error);
        return NextResponse.json(
            {
                error: "Error al iniciar proceso de firma",
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
