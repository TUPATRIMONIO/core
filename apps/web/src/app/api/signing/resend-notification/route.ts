import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * API Route: POST /api/signing/resend-notification
 *
 * Reenvía la notificación de firma a un firmante específico
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { signer_id } = body;

        if (!signer_id) {
            return NextResponse.json(
                { error: "signer_id es requerido" },
                { status: 400 },
            );
        }

        const supabase = createServiceRoleClient();

        // 1. Obtener firmante con documento
        const { data: signer, error: signerError } = await supabase
            .from("signing_signers")
            .select(`
                *,
                document:signing_documents (
                    id,
                    title,
                    organization_id
                )
            `)
            .eq("id", signer_id)
            .single();

        if (signerError || !signer) {
            return NextResponse.json(
                { error: "Firmante no encontrado" },
                { status: 404 },
            );
        }

        if (!signer.document) {
            return NextResponse.json(
                { error: "Documento no encontrado" },
                { status: 404 },
            );
        }

        if (!signer.signing_token) {
            return NextResponse.json(
                { error: "El firmante no tiene token de firma" },
                { status: 400 },
            );
        }

        // 2. Construir URL de firma
        const signUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signer.signing_token}`;

        // 3. Llamar a Edge Function para enviar notificación
        const notificationUrl =
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-signing-notification`;

        const notificationResponse = await fetch(notificationUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
                type: "SIGNING_REQUEST",
                recipient_email: signer.email,
                recipient_name: `${signer.first_name} ${signer.last_name}`.trim() || signer.email,
                document_title: signer.document.title,
                action_url: signUrl,
                org_id: signer.document.organization_id,
                document_id: signer.document.id,
                signer_id: signer.id,
            }),
        });

        if (!notificationResponse.ok) {
            const errorText = await notificationResponse.text();
            console.error("Error en Edge Function:", errorText);
            return NextResponse.json(
                { 
                    error: "Error al enviar notificación",
                    details: errorText 
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: `Notificación enviada a ${signer.email}`,
        });

    } catch (error: any) {
        console.error("Error reenviando notificación:", error);
        return NextResponse.json(
            { error: error.message || "Error al reenviar notificación" },
            { status: 500 },
        );
    }
}

