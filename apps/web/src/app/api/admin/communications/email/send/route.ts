import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
    sendEmail as sendGmailEmail,
    sendEmailWithSharedAccount,
} from "@/lib/gmail/client";
import { sendEmail as sendSendGridEmailMultiOrg } from "@/lib/sendgrid/client";
import type { SenderPurpose } from "@/lib/sendgrid/types";

interface RouteBody {
    orderId?: string;
    organizationId: string;
    toEmail: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    provider: "gmail" | "sendgrid";
    gmailAccessToken?: string; // Deprecated: ya no se usa, se obtiene de la cuenta compartida
    includeSignature?: boolean; // Si incluir firma personal (default: true)
    purpose?: SenderPurpose; // transactional o marketing (default: transactional)
}

export async function POST(request: NextRequest) {
    try {
        const body: RouteBody = await request.json();
        const {
            orderId,
            organizationId,
            toEmail,
            subject,
            bodyHtml,
            bodyText,
            provider,
            includeSignature = true,
            purpose = "transactional", // Por defecto transaccional para emails desde admin
        } = body;

        if (!toEmail || !subject || !bodyHtml || !provider) {
            return NextResponse.json(
                {
                    error:
                        "toEmail, subject, bodyHtml y provider son requeridos",
                },
                { status: 400 },
            );
        }

        // Obtener usuario autenticado para Gmail (necesario para firma personal)
        const supabaseAuth = await createClient();
        const {
            data: { user },
        } = await supabaseAuth.auth.getUser();

        if (provider === "gmail" && !user) {
            return NextResponse.json(
                {
                    error:
                        "Debes estar autenticado para enviar emails con Gmail",
                },
                { status: 401 },
            );
        }

        const supabase = createServiceRoleClient();

        // Crear registro en email_history usando función RPC (evita problema con vista)
        const { data: emailId, error: rpcError } = await supabase.rpc(
            "insert_email_history",
            {
                p_organization_id: organizationId,
                p_to_email: toEmail,
                p_subject: subject,
                p_body_html: bodyHtml,
                p_provider: provider,
                p_order_id: orderId || null,
                p_body_text: bodyText || null,
            },
        );

        if (rpcError || !emailId) {
            console.error("Error creando registro de email:", rpcError);
            return NextResponse.json(
                { error: "Error al crear registro de email" },
                { status: 500 },
            );
        }

        // Obtener el registro completo usando la vista pública (solo lectura)
        const { data: emailRecord, error: fetchError } = await supabase
            .from("email_history")
            .select("*")
            .eq("id", emailId)
            .single();

        if (fetchError || !emailRecord) {
            console.error("Error obteniendo registro de email:", fetchError);
            return NextResponse.json(
                { error: "Error al obtener registro de email creado" },
                { status: 500 },
            );
        }

        let messageId: string | undefined;
        let errorMessage: string | undefined;

        try {
            // Enviar email según el proveedor
            if (provider === "gmail") {
                // Usar cuenta compartida con firma personal
                const result = await sendEmailWithSharedAccount(
                    organizationId,
                    user!.id,
                    toEmail,
                    subject,
                    bodyHtml,
                    bodyText,
                    includeSignature,
                );
                messageId = result.messageId;
            } else if (provider === "sendgrid") {
                // Usar SendGrid con sender identity según propósito
                const result = await sendSendGridEmailMultiOrg(
                    organizationId,
                    {
                        to: toEmail,
                        from: "", // Se obtiene automáticamente del sender identity
                        subject,
                        html: bodyHtml,
                        text: bodyText,
                    },
                    { purpose },
                );
                // SendGrid devuelve el messageId en los headers
                messageId = result.headers?.["x-message-id"] || undefined;
            }

            // Actualizar registro como enviado
            await supabase
                .from("email_history")
                .update({
                    status: "sent",
                    provider_message_id: messageId,
                    sent_at: new Date().toISOString(),
                })
                .eq("id", emailRecord.id);

            return NextResponse.json({
                success: true,
                email_id: emailRecord.id,
                message_id: messageId,
                status: "sent",
            });
        } catch (error: any) {
            console.error("Error enviando email:", error);

            // Actualizar registro como fallido
            await supabase
                .from("email_history")
                .update({
                    status: "failed",
                    error_message: error.message || "Error desconocido",
                })
                .eq("id", emailRecord.id);

            return NextResponse.json(
                { error: error.message || "Error al enviar el email" },
                { status: 500 },
            );
        }
    } catch (error: any) {
        console.error(
            "Error en POST /api/admin/communications/email/send:",
            error,
        );
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 },
        );
    }
}
