/**
 * Configuración centralizada de SendGrid para emails de la aplicación
 * 
 * Soporta dos propósitos:
 * - transactional: Notificaciones de firma electrónica, alertas del sistema
 * - marketing: Newsletters, campañas, waitlist
 */

export type SendGridPurpose = "transactional" | "marketing";

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  purpose: SendGridPurpose;
}

/**
 * Obtiene la configuración de SendGrid según el propósito
 * 
 * @param purpose - "transactional" para notificaciones del sistema, "marketing" para campañas
 * @returns Configuración completa de SendGrid
 * @throws Error si no están configuradas las variables de entorno
 */
export function getSendGridConfig(purpose: SendGridPurpose = "transactional"): SendGridConfig {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const replyTo = Deno.env.get("SENDGRID_REPLY_TO") || "contacto@tupatrimonio.app";

  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY no configurada en Supabase Secrets");
  }

  // Configuración según propósito
  if (purpose === "transactional") {
    return {
      apiKey,
      fromEmail: Deno.env.get("SENDGRID_TX_FROM_EMAIL") || "notifications@hub.tupatrimon.io",
      fromName: Deno.env.get("SENDGRID_TX_FROM_NAME") || "TuPatrimonio",
      replyTo,
      purpose,
    };
  } else {
    return {
      apiKey,
      fromEmail: Deno.env.get("SENDGRID_MKT_FROM_EMAIL") || "info@news.tupatrimon.io",
      fromName: Deno.env.get("SENDGRID_MKT_FROM_NAME") || "TuPatrimonio News",
      replyTo,
      purpose,
    };
  }
}

/**
 * Envía un email usando SendGrid
 * 
 * @param config - Configuración de SendGrid
 * @param recipient - Email del destinatario
 * @param recipientName - Nombre del destinatario
 * @param subject - Asunto del email
 * @param htmlContent - Contenido HTML
 * @param textContent - Contenido texto plano
 * @param customArgs - Argumentos personalizados para tracking
 * @returns Response de SendGrid
 */
export async function sendEmail(
  config: SendGridConfig,
  recipient: string,
  recipientName: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  customArgs?: Record<string, string>
): Promise<Response> {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: recipient, name: recipientName }],
        custom_args: {
          purpose: config.purpose,
          ...customArgs,
        },
      }],
      from: {
        email: config.fromEmail,
        name: config.fromName,
      },
      reply_to: {
        email: config.replyTo,
      },
      subject,
      content: [
        { type: "text/plain", value: textContent },
        { type: "text/html", value: htmlContent },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
  }

  return response;
}

