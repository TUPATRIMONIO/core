// Edge Function: Enviar notificaciones por email
// Endpoint: POST /functions/v1/send-email-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailNotification {
  to: string
  subject: string
  type: 'signature_request' | 'signature_reminder' | 'document_completed' | 'notary_update'
  data: {
    documentId?: string
    documentTitle?: string
    signerName?: string
    signUrl?: string
    organizationName?: string
    [key: string]: any
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const notification: EmailNotification = await req.json()

    if (!notification.to || !notification.subject || !notification.type) {
      throw new Error('Missing required fields')
    }

    // Get email template based on type
    const emailContent = getEmailTemplate(notification.type, notification.data)

    // TODO: Integrate with SendGrid
    // For now, just log the email
    console.log('Email notification:')
    console.log('To:', notification.to)
    console.log('Subject:', notification.subject)
    console.log('Type:', notification.type)
    console.log('Content:', emailContent)

    // Simulate sending email
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{
    //       to: [{ email: notification.to }],
    //     }],
    //     from: { email: 'noreply@tupatrimonio.cl', name: 'TuPatrimonio' },
    //     subject: notification.subject,
    //     content: [{
    //       type: 'text/html',
    //       value: emailContent,
    //     }],
    //   }),
    // })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

function getEmailTemplate(type: string, data: any): string {
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #800039; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { background: #800039; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      .footer { text-align: center; margin-top: 20px; color: #7a7a7a; font-size: 12px; }
    </style>
  `

  switch (type) {
    case 'signature_request':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Solicitud de Firma Electrónica</h1>
            </div>
            <div class="content">
              <p>Hola ${data.signerName || 'Usuario'},</p>
              <p>Has sido invitado a firmar el documento: <strong>${data.documentTitle}</strong></p>
              <p>Solicitado por: <strong>${data.organizationName}</strong></p>
              <p>Para firmar el documento, haz clic en el siguiente botón:</p>
              <a href="${data.signUrl}" class="button">Firmar Documento</a>
              <p style="margin-top: 20px; font-size: 14px; color: #7a7a7a;">
                Este enlace expirará en ${data.expiryDays || 30} días.
              </p>
            </div>
            <div class="footer">
              <p>TuPatrimonio - Tu tranquilidad, nuestra prioridad</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'signature_reminder':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recordatorio de Firma Pendiente</h1>
            </div>
            <div class="content">
              <p>Hola ${data.signerName || 'Usuario'},</p>
              <p>Te recordamos que tienes pendiente firmar el documento: <strong>${data.documentTitle}</strong></p>
              <p>Para completar la firma, haz clic en el siguiente botón:</p>
              <a href="${data.signUrl}" class="button">Firmar Ahora</a>
            </div>
            <div class="footer">
              <p>TuPatrimonio - Tu tranquilidad, nuestra prioridad</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'document_completed':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Documento Completado</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>El documento <strong>${data.documentTitle}</strong> ha sido completamente firmado por todas las partes.</p>
              <p>Puedes descargar el documento firmado desde tu panel de control.</p>
              <a href="${data.dashboardUrl}" class="button">Ver Documento</a>
            </div>
            <div class="footer">
              <p>TuPatrimonio - Tu tranquilidad, nuestra prioridad</p>
            </div>
          </div>
        </body>
        </html>
      `

    case 'notary_update':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Actualización de Servicio Notarial</h1>
            </div>
            <div class="content">
              <p>Hola,</p>
              <p>Tu solicitud notarial para <strong>${data.documentTitle}</strong> ha sido actualizada.</p>
              <p>Estado actual: <strong>${data.status}</strong></p>
              ${data.message ? `<p>${data.message}</p>` : ''}
              <a href="${data.dashboardUrl}" class="button">Ver Detalles</a>
            </div>
            <div class="footer">
              <p>TuPatrimonio - Tu tranquilidad, nuestra prioridad</p>
            </div>
          </div>
        </body>
        </html>
      `

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Notificación de TuPatrimonio</h1>
            </div>
            <div class="content">
              <p>Has recibido una notificación de TuPatrimonio.</p>
            </div>
            <div class="footer">
              <p>TuPatrimonio - Tu tranquilidad, nuestra prioridad</p>
            </div>
          </div>
        </body>
        </html>
      `
  }
}

