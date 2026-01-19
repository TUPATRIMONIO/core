"use server";

import sgMail from "@sendgrid/mail";
import { getSendGridAccount, getSenderByPurpose } from "@/lib/sendgrid/accounts";

interface SupportTicketNotificationInput {
  organizationId: string;
  toEmail: string;
  ticketNumber: string;
  subject: string;
  messageText: string;
  ticketUrl: string;
}

export async function sendSupportTicketNotification(
  input: SupportTicketNotificationInput,
) {
  const account = await getSendGridAccount(input.organizationId);
  if (!account) {
    console.error("SendGrid account no configurada.");
    return { success: false, error: "SendGrid no configurado." };
  }

  const senderIdentity = await getSenderByPurpose(input.organizationId, "transactional");
  const fromEmail = senderIdentity?.from_email || account.from_email;
  const fromName = senderIdentity?.from_name || account.from_name;
  const replyTo = senderIdentity?.reply_to_email || undefined;

  sgMail.setApiKey(account.api_key);

  const subject = `[Ticket ${input.ticketNumber}] ${input.subject}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="margin-bottom: 8px;">Tenemos novedades en tu ticket</h2>
      <p>Hola,</p>
      <p>Respondimos tu solicitud. Aquí está el mensaje:</p>
      <div style="background: #f7f7f7; padding: 12px; border-radius: 8px; margin: 12px 0;">
        ${input.messageText.replace(/\n/g, "<br />")}
      </div>
      <p>Puedes responder desde tu cuenta aquí:</p>
      <p>
        <a href="${input.ticketUrl}" style="color: #800039; text-decoration: none;">
          Ver ticket y responder
        </a>
      </p>
      <p>Si necesitas algo más, estamos aquí para ayudarte.</p>
      <p style="margin-top: 24px;">Tu Tranquilidad, Nuestra Prioridad.</p>
    </div>
  `;

  const text = `Tenemos novedades en tu ticket ${input.ticketNumber}\n\n${input.messageText}\n\nResponder aquí: ${input.ticketUrl}`;

  try {
    await sgMail.send({
      to: input.toEmail,
      from: { email: fromEmail, name: fromName },
      replyTo,
      subject,
      html,
      text,
    });

    return { success: true };
  } catch (error: any) {
    console.error("SendGrid send error:", error);
    return { success: false, error: "No se pudo enviar el email." };
  }
}
