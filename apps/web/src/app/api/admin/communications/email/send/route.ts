import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmail as sendGmailEmail } from '@/lib/gmail/client'
import { sendEmail as sendSendGridEmailMultiOrg } from '@/lib/sendgrid/client'

interface RouteBody {
    orderId?: string
    organizationId: string
    toEmail: string
    subject: string
    bodyHtml: string
    bodyText?: string
    provider: 'gmail' | 'sendgrid'
    gmailAccessToken?: string // Requerido si provider es 'gmail'
}

export async function POST(request: NextRequest) {
    try {
        const body: RouteBody = await request.json()
        const {
            orderId,
            organizationId,
            toEmail,
            subject,
            bodyHtml,
            bodyText,
            provider,
            gmailAccessToken,
        } = body

        if (!toEmail || !subject || !bodyHtml || !provider) {
            return NextResponse.json(
                { error: 'toEmail, subject, bodyHtml y provider son requeridos' },
                { status: 400 }
            )
        }

        if (provider === 'gmail' && !gmailAccessToken) {
            return NextResponse.json(
                { error: 'gmailAccessToken es requerido cuando provider es gmail' },
                { status: 400 }
            )
        }

        const supabase = createServiceRoleClient()

        // Crear registro en email_history con status 'pending'
        const { data: emailRecord, error: emailError } = await supabase
            .from('email_history')
            .insert({
                organization_id: organizationId,
                order_id: orderId || null,
                to_email: toEmail,
                subject,
                body_html: bodyHtml,
                body_text: bodyText || null,
                provider,
                status: 'pending',
            })
            .select()
            .single()

        if (emailError) {
            console.error('Error creando registro de email:', emailError)
            return NextResponse.json(
                { error: 'Error al crear registro de email' },
                { status: 500 }
            )
        }

        let messageId: string | undefined
        let errorMessage: string | undefined

        try {
            // Enviar email según el proveedor
            if (provider === 'gmail') {
                const result = await sendGmailEmail(
                    gmailAccessToken!,
                    toEmail,
                    subject,
                    bodyHtml,
                    bodyText
                )
                messageId = result.messageId
            } else if (provider === 'sendgrid') {
                const result = await sendSendGridEmailMultiOrg(
                    organizationId,
                    {
                        to: toEmail,
                        subject,
                        html: bodyHtml,
                        text: bodyText,
                    }
                )
                // SendGrid devuelve el messageId en los headers
                messageId = result.headers?.['x-message-id'] || undefined
            }

            // Actualizar registro como enviado
            await supabase
                .from('email_history')
                .update({
                    status: 'sent',
                    provider_message_id: messageId,
                    sent_at: new Date().toISOString(),
                })
                .eq('id', emailRecord.id)

            return NextResponse.json({
                success: true,
                email_id: emailRecord.id,
                message_id: messageId,
                status: 'sent',
            })
        } catch (error: any) {
            console.error('Error enviando email:', error)

            // Actualizar registro como fallido
            await supabase
                .from('email_history')
                .update({
                    status: 'failed',
                    error_message: error.message || 'Error desconocido',
                })
                .eq('id', emailRecord.id)

            return NextResponse.json(
                { error: error.message || 'Error al enviar el email' },
                { status: 500 }
            )
        }
    } catch (error: any) {
        console.error('Error en POST /api/admin/communications/email/send:', error)
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

