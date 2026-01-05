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
  type: "REVIEW_REQUEST" | "SIGNING_REQUEST" | "SIGNING_COMPLETED";
  recipient_email: string;
  recipient_name: string;
  document_title: string;
  action_url: string;
  org_id: string;
  document_id?: string;
  signer_id?: string;
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

    default:
      throw new Error(`Tipo de notificación no válido: ${payload.type}`);
  }
}

