import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSendGridConfig, sendEmail } from "../_shared/sendgrid-config.ts";

// Configuración CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type:
    | "REVIEW_REQUEST"
    | "SIGNING_REQUEST"
    | "SIGNING_COMPLETED"
    | "NOTARY_DOCUMENT_ASSIGNED"
    | "NOTARY_IN_PROGRESS"
    | "NOTARY_NEEDS_CORRECTION"
    | "NOTARY_REJECTED"
    | "NOTARY_COMPLETED"
    | "NOTARY_BATCH_COMPLETED"
    | "ORDER_COMPLETED";
  recipient_email: string;
  recipient_name: string;
  document_title: string;
  action_url: string;
  org_id: string;
  document_id?: string;
  signer_id?: string;
  signed_url?: string;
  notarized_url?: string;
  google_review_url?: string;
  has_notary_service?: boolean;
  batch_results?: {
    total: number;
    successful: number;
    failed: number;
    documents: Array<{ filename: string; status: string; error?: string }>;
  };
}

serve(async (req) => {
  // Manejo de preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: NotificationPayload = await req.json();

    // Validar payload requerido
    if (
      !payload.type ||
      !payload.recipient_email ||
      !payload.document_title ||
      !payload.action_url ||
      !payload.org_id
    ) {
      throw new Error(
        "Payload incompleto. Requiere: type, recipient_email, document_title, action_url, org_id"
      );
    }

    // Usar configuración transaccional centralizada
    const config = getSendGridConfig("transactional");
    console.log(`[send-signing-notification] Enviando desde: ${config.fromEmail} (${config.fromName}) → ${payload.recipient_email}`);

    // Generar contenido del email según tipo
    const emailContent = generateEmailContent(payload);

    // Enviar email usando helper
    await sendEmail(
      config,
      payload.recipient_email,
      payload.recipient_name || payload.recipient_email,
      emailContent.subject,
      emailContent.html,
      emailContent.text,
      {
        organization_id: payload.org_id,
        document_id: payload.document_id || "",
        signer_id: payload.signer_id || "",
        notification_type: payload.type,
      }
    );

    // Registrar en email_history para auditoría
    try {
      await supabaseClient
        .from("email_history")
        .insert({
          organization_id: payload.org_id,
          to_email: payload.recipient_email,
          from_email: config.fromEmail,
          subject: emailContent.subject,
          body_html: emailContent.html,
          body_text: emailContent.text,
          provider: "sendgrid",
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: {
            document_id: payload.document_id,
            signer_id: payload.signer_id,
            notification_type: payload.type,
            purpose: "transactional",
          },
        });
      console.log(`[send-signing-notification] Email registrado en historial`);
    } catch (logError) {
      // No fallar si el logging falla
      console.error("[send-signing-notification] Error registrando en email_history:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado exitosamente",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error en send-signing-notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido al enviar notificación",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Genera el contenido del email según el tipo de notificación
 */
function generateEmailContent(payload: NotificationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://app.tupatrimonio.app";
  
  // Asegurar que action_url existe y construir URL correctamente
  let actionUrl = payload.action_url || "";
  if (actionUrl && !actionUrl.startsWith("http")) {
    // Asegurar que hay un / entre baseUrl y action_url
    const separator = actionUrl.startsWith("/") ? "" : "/";
    actionUrl = `${baseUrl}${separator}${actionUrl}`;
  }

  switch (payload.type) {
    case "REVIEW_REQUEST":
      return {
        subject: `Revisión requerida: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #800039; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Revisión de Documento Requerida</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Usuario"},</p>
              <p>Se requiere tu revisión y aprobación para el siguiente documento:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #800039; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #800039;">${payload.document_title}</h2>
              </div>
              <p>Por favor, revisa el documento y aprueba o rechaza según corresponda.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #800039; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Revisar Documento
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${actionUrl}" style="color: #800039;">${actionUrl}</a>
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Revisión de Documento Requerida

Hola ${payload.recipient_name || "Usuario"},

Se requiere tu revisión y aprobación para el siguiente documento:

${payload.document_title}

Por favor, revisa el documento y aprueba o rechaza según corresponda.

Accede al documento aquí: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "SIGNING_REQUEST":
      return {
        subject: `Firma requerida: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #800039; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Firma Electrónica Requerida</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Usuario"},</p>
              <p>Se requiere tu firma electrónica para el siguiente documento:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #800039; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #800039;">${payload.document_title}</h2>
              </div>
              <p>Por favor, revisa el documento y procede a firmarlo electrónicamente.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #800039; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Firmar Documento
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${actionUrl}" style="color: #800039;">${actionUrl}</a>
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 20px;">
                <strong>Importante:</strong> Tu firma electrónica tiene la misma validez legal que tu firma manuscrita.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Firma Electrónica Requerida

Hola ${payload.recipient_name || "Usuario"},

Se requiere tu firma electrónica para el siguiente documento:

${payload.document_title}

Por favor, revisa el documento y procede a firmarlo electrónicamente.

Firma el documento aquí: ${actionUrl}

Importante: Tu firma electrónica tiene la misma validez legal que tu firma manuscrita.

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "SIGNING_COMPLETED":
      return {
        subject: `Documento firmado: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">✓ Documento Firmado</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Usuario"},</p>
              <p>Te informamos que el siguiente documento ha sido firmado exitosamente:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #10b981;">${payload.document_title}</h2>
              </div>
              <p>El proceso de firma electrónica se ha completado correctamente.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ver Documento Firmado
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Documento Firmado

Hola ${payload.recipient_name || "Usuario"},

Te informamos que el siguiente documento ha sido firmado exitosamente:

${payload.document_title}

El proceso de firma electrónica se ha completado correctamente.

Ver documento firmado: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_DOCUMENT_ASSIGNED":
      return {
        subject: `Nuevo documento notarial: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #800039; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Documento Asignado a Notaría</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Equipo"},</p>
              <p>Se ha asignado un nuevo documento para revisión notarial:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #800039; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #800039;">${payload.document_title}</h2>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #800039; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ir al Portal Notarial
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${actionUrl}" style="color: #800039;">${actionUrl}</a>
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Documento asignado a notaría

Hola ${payload.recipient_name || "Equipo"},

Se ha asignado un nuevo documento para revisión notarial:
${payload.document_title}

Ir al portal notarial: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_IN_PROGRESS":
      return {
        subject: `Documento en notaría: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Documento Enviado a Notaría</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Usuario"},</p>
              <p>Tu documento ya está en revisión notarial:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #6b7280; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #6b7280;">${payload.document_title}</h2>
              </div>
              <p>Te avisaremos apenas tengamos novedades.</p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Documento enviado a notaría

Hola ${payload.recipient_name || "Usuario"},

Tu documento ya está en revisión notarial:
${payload.document_title}

Te avisaremos apenas tengamos novedades.

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_NEEDS_CORRECTION":
      return {
        subject: `Observaciones notariales: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Observaciones de Notaría</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Equipo"},</p>
              <p>La notaría dejó observaciones para el siguiente documento:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #f59e0b;">${payload.document_title}</h2>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ver Observaciones
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${actionUrl}" style="color: #f59e0b;">${actionUrl}</a>
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Observaciones de notaría

Hola ${payload.recipient_name || "Equipo"},

La notaría dejó observaciones para el siguiente documento:
${payload.document_title}

Ver observaciones: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_REJECTED":
      return {
        subject: `Rechazo notarial: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Documento Rechazado</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Equipo"},</p>
              <p>La notaría rechazó el siguiente documento:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #ef4444;">${payload.document_title}</h2>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Revisar Detalles
                </a>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
                <a href="${actionUrl}" style="color: #ef4444;">${actionUrl}</a>
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Documento rechazado por notaría

Hola ${payload.recipient_name || "Equipo"},

La notaría rechazó el siguiente documento:
${payload.document_title}

Revisar detalles: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_COMPLETED":
      return {
        subject: `Documento notariado: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Documento Notariado</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Usuario"},</p>
              <p>Tu documento ha sido notariado exitosamente:</p>
              <div style="background-color: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #10b981;">${payload.document_title}</h2>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ver Documento Notariado
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Documento notariado

Hola ${payload.recipient_name || "Usuario"},

Tu documento ha sido notariado exitosamente:
${payload.document_title}

Ver documento notariado: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "NOTARY_BATCH_COMPLETED":
      const results = payload.batch_results;
      const successList = results?.documents
        ?.filter(d => d.status === 'success')
        ?.map(d => `<li style="color: #10b981;">✓ ${d.filename}</li>`)
        ?.join('') || '';
      
      const failureList = results?.documents
        ?.filter(d => d.status === 'failed')
        ?.map(d => `<li style="color: #ef4444;">✗ ${d.filename} - ${d.error || 'Error desconocido'}</li>`)
        ?.join('') || '';

      return {
        subject: `Procesamiento de lote completado - ${results?.successful || 0}/${results?.total || 0} exitosos`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #800039; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Procesamiento de Documentos Completado</h1>
            </div>
            <div style="background-color: #f7f7f7; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola ${payload.recipient_name || "Notaría"},</p>
              <p>El lote de documentos notarizados ha sido procesado:</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 32px; font-weight: bold; color: #800039;">${results?.total || 0}</div>
                    <div style="font-size: 12px; color: #666;">Total</div>
                  </div>
                  <div>
                    <div style="font-size: 32px; font-weight: bold; color: #10b981;">${results?.successful || 0}</div>
                    <div style="font-size: 12px; color: #666;">Exitosos</div>
                  </div>
                  <div>
                    <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${results?.failed || 0}</div>
                    <div style="font-size: 12px; color: #666;">Fallidos</div>
                  </div>
                </div>
              </div>

              ${results?.successful ? `
              <div style="margin: 20px 0;">
                <h3 style="color: #10b981;">Documentos procesados exitosamente:</h3>
                <ul style="list-style: none; padding-left: 0;">${successList}</ul>
              </div>
              ` : ''}

              ${results?.failed ? `
              <div style="margin: 20px 0;">
                <h3 style="color: #ef4444;">Documentos con error:</h3>
                <ul style="list-style: none; padding-left: 0;">${failureList}</ul>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #800039; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                  Ver Dashboard
                </a>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.</p>
            </div>
          </body>
          </html>
        `,
        text: `
Procesamiento de Documentos Completado

Hola ${payload.recipient_name || "Notaría"},

El lote de documentos notarizados ha sido procesado:

Total: ${results?.total || 0}
Exitosos: ${results?.successful || 0}
Fallidos: ${results?.failed || 0}

${results?.successful ? `\nDocumentos exitosos:\n${results.documents.filter(d => d.status === 'success').map(d => `- ${d.filename}`).join('\n')}` : ''}

${results?.failed ? `\nDocumentos con error:\n${results.documents.filter(d => d.status === 'failed').map(d => `- ${d.filename}: ${d.error}`).join('\n')}` : ''}

Ver dashboard: ${actionUrl}

Este es un email automático de TuPatrimonio. Por favor, no respondas a este mensaje.
        `,
      };

    case "ORDER_COMPLETED":
      const signedUrl = payload.signed_url;
      const notarizedUrl = payload.notarized_url;
      const googleReviewUrl = payload.google_review_url || "https://g.page/Tu-patrimonio-chile/review?gm";
      const hasNotaryService = payload.has_notary_service;

      // Botones de descarga
      let downloadButtons = "";
      let textLinks = "";

      if (signedUrl) {
          downloadButtons += `
              <a href="${signedUrl}" style="background-color: #800039; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
                  Descargar Firmado
              </a>
          `;
          textLinks += `Descargar Firmado: ${signedUrl}\n`;
      }

      if (notarizedUrl) {
          downloadButtons += `
              <a href="${notarizedUrl}" style="background-color: #4a4a4a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
                  Descargar Notarizado
              </a>
          `;
          textLinks += `Descargar Notarizado: ${notarizedUrl}\n`;
      }

      return {
        subject: `Tu documento está listo: ${payload.document_title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9f9;">
            
            <!-- Header -->
            <div style="background-color: #10b981; color: white; padding: 30px 20px; text-align: center; border-radius: 0 0 0 0;">
              <h1 style="margin: 0; font-size: 24px;">¡Tu documento está listo!</h1>
            </div>

            <div style="background-color: white; padding: 30px; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <p style="font-size: 16px;">Hola <strong>${payload.recipient_name || "Usuario"}</strong>,</p>
              
              <p>Te informamos que el proceso para el documento <strong>"${payload.document_title}"</strong> ha finalizado exitosamente.</p>
              
              ${hasNotaryService ? 
                  '<p>El documento ha sido firmado por todas las partes y legalizado ante notario.</p>' : 
                  '<p>El documento ha sido firmado electrónicamente por todas las partes.</p>'
              }

              <!-- Download Section -->
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f0f0f0; border-radius: 8px;">
                  <p style="margin-top: 0; font-size: 14px; color: #666; margin-bottom: 15px;">Descarga tus documentos aquí:</p>
                  ${downloadButtons}
              </div>

              <!-- Review Section -->
              <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 30px; text-align: center;">
                  <h3 style="color: #800039; margin-bottom: 10px;">¿Qué te pareció nuestro servicio?</h3>
                  
                  <p style="font-size: 18px; margin-bottom: 5px;">⭐⭐⭐⭐⭐</p>
                  
                  <p style="font-size: 15px; color: #444; max-width: 400px; margin: 0 auto 20px auto;">
                      Déjanos una reseña de <strong>5 estrellas en Google</strong> y obtén un <span style="color: #10b981; font-weight: bold;">20% de descuento</span> en tu próxima compra.
                  </p>

                  <a href="${googleReviewUrl}" style="background-color: #fff; color: #800039; border: 2px solid #800039; padding: 10px 20px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: bold; font-size: 14px;">
                      Dejar mi reseña en Google
                  </a>

                  <p style="font-size: 12px; color: #888; margin-top: 15px;">
                      *Para reclamar tu descuento, envíanos una captura de tu reseña a <a href="mailto:contacto@tupatrimonio.app" style="color: #888;">contacto@tupatrimonio.app</a>
                  </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p style="margin: 5px 0;">TuPatrimonio.app - Simplificando tus trámites legales</p>
              <p style="margin: 5px 0;">Este es un mensaje automático, por favor no responder.</p>
            </div>

          </body>
          </html>
        `,
        text: `
¡Tu documento está listo!

Hola ${payload.recipient_name || "Usuario"},

Te informamos que el proceso para el documento "${payload.document_title}" ha finalizado exitosamente.

${textLinks}

---
¿Qué te pareció nuestro servicio?

Déjanos una reseña de 5 estrellas en Google y obtén un 20% de descuento en tu próxima compra.

Enlace para reseña: ${googleReviewUrl}

Para reclamar tu descuento, envíanos una captura de tu reseña a contacto@tupatrimonio.app
---

TuPatrimonio.app
        `,
      };

    default:
      throw new Error(`Tipo de notificación no válido: ${payload.type}`);
  }
}

