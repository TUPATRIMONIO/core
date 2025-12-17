/**
 * API Route: Test SendGrid Email
 *
 * POST: Envía un email de prueba usando el sender identity configurado
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserActiveOrganization } from "@/lib/organization/utils";
import { sendEmail } from "@/lib/sendgrid/client";
import { getSenderByPurpose } from "@/lib/sendgrid/accounts";
import type { SenderPurpose } from "@/lib/sendgrid/types";

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Verificar autenticación
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener organización activa del usuario
    const { organization, error: orgError } = await getUserActiveOrganization(
        supabase,
    );

    if (!organization) {
        return NextResponse.json(
            { error: orgError || "No se encontró organización" },
            { status: 404 },
        );
    }

    try {
        const body = await request.json();
        const { to_email, purpose = "transactional" } = body as {
            to_email: string;
            purpose?: SenderPurpose;
        };

        if (!to_email) {
            return NextResponse.json(
                { error: "Email destinatario requerido" },
                { status: 400 },
            );
        }

        // Obtener sender identity para el propósito seleccionado
        const sender = await getSenderByPurpose(organization.id, purpose);

        if (!sender) {
            return NextResponse.json(
                { error: `No hay remitente configurado para "${purpose}"` },
                { status: 400 },
            );
        }

        // Enviar email de prueba
        const result = await sendEmail(
            organization.id,
            {
                to: to_email,
                from: "", // Se obtiene del sender identity
                subject: `[PRUEBA] Email ${
                    purpose === "transactional" ? "Transaccional" : "Marketing"
                } - ${organization.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #18181b;">✅ Email de Prueba</h1>
                        <p>Este es un email de prueba para verificar la configuración del remitente.</p>
                        <hr style="border: 1px solid #e4e4e7; margin: 20px 0;">
                        <table style="width: 100%; font-size: 14px;">
                            <tr>
                                <td style="padding: 8px 0; color: #71717a;">Organización:</td>
                                <td style="padding: 8px 0; font-weight: bold;">${organization.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #71717a;">Propósito:</td>
                                <td style="padding: 8px 0; font-weight: bold;">${
                    purpose === "transactional" ? "Transaccional" : "Marketing"
                }</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #71717a;">Remitente:</td>
                                <td style="padding: 8px 0; font-weight: bold;">${sender.from_name} &lt;${sender.from_email}&gt;</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #71717a;">Fecha:</td>
                                <td style="padding: 8px 0;">${
                    new Date().toLocaleString("es-CL")
                }</td>
                            </tr>
                        </table>
                        <hr style="border: 1px solid #e4e4e7; margin: 20px 0;">
                        <p style="color: #71717a; font-size: 12px;">
                            Este email fue enviado como prueba desde la configuración de SendGrid.
                        </p>
                    </div>
                `,
            },
            { purpose },
        );

        return NextResponse.json({
            success: true,
            message: "Email de prueba enviado",
            message_id: result.headers?.["x-message-id"],
            sender: {
                email: sender.from_email,
                name: sender.from_name,
            },
        });
    } catch (error: any) {
        console.error("Error enviando email de prueba:", error);
        return NextResponse.json(
            { error: error.message || "Error al enviar email de prueba" },
            { status: 500 },
        );
    }
}
