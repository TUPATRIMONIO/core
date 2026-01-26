"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { sendSupportTicketNotification } from "@/lib/email/sendgrid";
import { getUserActiveOrganization } from "@/lib/organization/utils";

export async function addCrmTicketMessage(params: {
  ticketId: string;
  message: string;
  isInternal?: boolean;
  sendEmailNotification?: boolean;
}) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado." };
  }

  const messageText = params.message.trim();
  if (!messageText) {
    return { success: false, error: "El mensaje no puede estar vacío." };
  }

  const serviceSupabase = createServiceRoleClient();

  const { data: ticket } = await serviceSupabase
    .from("crm_tickets")
    .select("organization_id, ticket_number, subject, user_email, user_id")
    .eq("id", params.ticketId)
    .single();

  if (!ticket) {
    return { success: false, error: "Ticket no encontrado." };
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabaseAuth.rpc("is_platform_admin");

  // Si no es platform admin, verificar que pertenece a la organización
  if (!isPlatformAdmin) {
    const { data: orgUser } = await serviceSupabase
      .schema("core")
      .from("organization_users")
      .select("id")
      .eq("organization_id", ticket.organization_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!orgUser) {
      return { success: false, error: "No tienes acceso a este ticket." };
    }
  }

  const { error } = await serviceSupabase
    .from("crm_ticket_messages")
    .insert({
      ticket_id: params.ticketId,
      sender_type: "admin",
      sender_id: user.id,
      message_text: messageText,
      message_html: messageText.replace(/\n/g, "<br>"),
      is_internal: params.isInternal ?? false,
    });

  if (error) {
    console.error("addCrmTicketMessage error:", error);
    return { success: false, error: "No pudimos enviar el mensaje." };
  }

  if (params.sendEmailNotification && ticket.user_email) {
    const orgResult = await getUserActiveOrganization(supabaseAuth);
    const organizationId = orgResult.organization?.id;
    if (organizationId) {
      const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tupatrimonio.app"}/dashboard/support/tickets/${params.ticketId}`;
      await sendSupportTicketNotification({
        organizationId,
        toEmail: ticket.user_email,
        ticketNumber: ticket.ticket_number,
        subject: ticket.subject,
        messageText,
        ticketUrl,
      });
    }
  }

  return { success: true };
}
