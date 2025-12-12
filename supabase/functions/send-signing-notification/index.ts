import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // 1. Obtener cuenta SendGrid de la organización
    const { data: sendgridAccount, error: accountError } =
      await supabaseClient
        .from("sendgrid_accounts")
        .select("api_key, from_email, from_name")
        .eq("organization_id", payload.org_id)
        .eq("is_active", true)
        .single();

    if (accountError || !sendgridAccount) {
      throw new Error(
        `No se encontró cuenta SendGrid activa para la organización ${payload.org_id}. Error: ${accountError?.message}`
      );
    }

    // Desencriptar API key (si está encriptada)
    // Nota: En producción, las API keys deberían estar encriptadas
    // Por ahora asumimos que están en texto plano o necesitamos desencriptarlas
    const apiKey = sendgridAccount.api_key;

    // 2. Generar contenido del email según tipo
    const emailContent = generateEmailContent(payload);

    // 3. Enviar email usando SendGrid API v3
    const sendgridResponse = await fetch(
      "https://api.sendgrid.com/v3/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [
                {
                  email: payload.recipient_email,
                  name: payload.recipient_name || payload.recipient_email,
                },
              ],
              dynamic_template_data: {
                document_title: payload.document_title,
                action_url: payload.action_url,
                recipient_name: payload.recipient_name || "Usuario",
                organization_name: "TuPatrimonio", // TODO: Obtener de BD si es necesario
              },
            },
          ],
          from: {
            email: sendgridAccount.from_email || "noreply@tupatrimonio.cl",
            name: sendgridAccount.from_name || "TuPatrimonio",
          },
          subject: emailContent.subject,
          content: [
            {
              type: "text/html",
              value: emailContent.html,
            },
            {
              type: "text/plain",
              value: emailContent.text,
            },
          ],
          custom_args: {
            organization_id: payload.org_id,
            document_id: payload.document_id || "",
            signer_id: payload.signer_id || "",
            notification_type: payload.type,
          },
        }),
      }
    );

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      throw new Error(
        `Error al enviar email con SendGrid: ${sendgridResponse.status} - ${errorText}`
      );
    }

    const responseData = await sendgridResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado exitosamente",
        sendgrid_response: responseData,
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
  const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://tupatrimonio.cl";
  const actionUrl = payload.action_url.startsWith("http")
    ? payload.action_url
    : `${baseUrl}${payload.action_url}`;

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

