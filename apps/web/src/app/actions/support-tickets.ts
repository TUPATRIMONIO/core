"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getActiveOrganizationId } from "@/lib/organization/get-active-org";
import { sendSupportTicketNotification } from "@/lib/email/sendgrid";

export type SupportTicketStatus = "open" | "pending" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "medium" | "high";

interface CreateSupportTicketInput {
  subject: string;
  message: string;
}

async function isPlatformAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
}

async function getPlatformOrganizationId() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .schema("core")
    .from("organizations")
    .select("id")
    .eq("org_type", "platform")
    .eq("status", "active")
    .single();

  return data?.id ?? null;
}

export async function createSupportTicket(input: CreateSupportTicketInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado." };
  }

  const orgResult = await getActiveOrganizationId(supabase, user.id);
  const organizationId = orgResult.organizationId;

  const serviceSupabase = createServiceRoleClient();
  const { data: ticket, error } = await serviceSupabase
    .schema("communications")
    .from("support_tickets")
    .insert({
      user_id: user.id,
      user_email: user.email,
      subject: input.subject.trim(),
      source: "user_created",
      organization_id: organizationId,
      priority: "medium",
      status: "open",
    })
    .select("id, ticket_number")
    .single();

  if (error || !ticket) {
    console.error("createSupportTicket error:", error);
    return { success: false, error: "No pudimos crear el ticket." };
  }

  const messageText = input.message.trim();
  const { error: messageError } = await serviceSupabase
    .schema("communications")
    .from("ticket_messages")
    .insert({
    ticket_id: ticket.id,
    sender_type: "user",
    sender_id: user.id,
    message_text: messageText,
    message_html: messageText.replace(/\n/g, "<br>"),
    is_internal: false,
    });

  if (messageError) {
    console.error("createSupportTicket message error:", messageError);
  }

  return { success: true, ticketId: ticket.id };
}

export async function getMySupportTickets(params: {
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], total: 0 };
  }

  const serviceSupabase = createServiceRoleClient();
  const filter =
    user.email ? `user_id.eq.${user.id},user_email.eq.${user.email}` : `user_id.eq.${user.id}`;

  const { data, error, count } = await serviceSupabase
    .schema("communications")
    .from("support_tickets")
    .select("id, ticket_number, subject, status, priority, created_at, updated_at", {
      count: "exact",
    })
    .or(filter)
    .order("created_at", { ascending: false })
    .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20) - 1);

  if (error) {
    console.error("getMySupportTickets error:", error);
    return { items: [], total: 0 };
  }

  return { items: data ?? [], total: count ?? 0 };
}

export async function getMySupportTicketById(ticketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ticket: null, messages: [] };
  }

  const serviceSupabase = createServiceRoleClient();
  const filter =
    user.email ? `user_id.eq.${user.id},user_email.eq.${user.email}` : `user_id.eq.${user.id}`;

  const { data: ticket, error } = await serviceSupabase
    .schema("communications")
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .or(filter)
    .single();

  if (error || !ticket) {
    console.error("getMySupportTicketById error:", error);
    return { ticket: null, messages: [] };
  }

  const { data: messages } = await serviceSupabase
    .schema("communications")
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return { ticket, messages: messages ?? [] };
}

export async function addUserTicketMessage(params: {
  ticketId: string;
  message: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado." };
  }

  const messageText = params.message.trim();
  if (!messageText) {
    return { success: false, error: "El mensaje no puede estar vacío." };
  }

  const serviceSupabase = createServiceRoleClient();
  const filter =
    user.email ? `user_id.eq.${user.id},user_email.eq.${user.email}` : `user_id.eq.${user.id}`;

  const { data: ticket } = await serviceSupabase
    .schema("communications")
    .from("support_tickets")
    .select("id")
    .eq("id", params.ticketId)
    .or(filter)
    .maybeSingle();

  if (!ticket) {
    return { success: false, error: "No tienes acceso a este ticket." };
  }

  const { error } = await serviceSupabase
    .schema("communications")
    .from("ticket_messages")
    .insert({
    ticket_id: params.ticketId,
    sender_type: "user",
    sender_id: user.id,
    message_text: messageText,
    message_html: messageText.replace(/\n/g, "<br>"),
    is_internal: false,
    });

  if (error) {
    console.error("addUserTicketMessage error:", error);
    return { success: false, error: "No pudimos enviar tu mensaje." };
  }

  return { success: true };
}

// ===========================
// Admin actions
// ===========================

export async function getAdminSupportTickets(params: {
  limit?: number;
  offset?: number;
  status?: SupportTicketStatus;
}) {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { items: [], total: 0 };
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("support_tickets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (typeof params.offset === "number" && typeof params.limit === "number") {
    query = query.range(params.offset, params.offset + params.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("getAdminSupportTickets error:", error);
    return { items: [], total: 0 };
  }

  const items = data ?? [];
  const userIds = [...new Set(items.map((item) => item.user_id).filter(Boolean))] as string[];

  let userMap = new Map<string, string>();
  let emailMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .schema("core")
      .from("users")
      .select("id, first_name, last_name")
      .in("id", userIds);

    userMap = new Map(
      (usersData ?? []).map((user) => [
        user.id,
        [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
      ])
    );

    const emailEntries = await Promise.all(
      userIds.map(async (userId) => {
        const { data: authData } = await supabase.auth.admin.getUserById(userId);
        return [userId, authData?.user?.email ?? ""] as const;
      })
    );
    emailMap = new Map(emailEntries);
  }

  const enriched = items.map((item) => ({
    ...item,
    user_display:
      userMap.get(item.user_id) ||
      emailMap.get(item.user_id) ||
      item.user_email ||
      null,
  }));

  return { items: enriched, total: count ?? 0 };
}

export async function getAdminSupportTicketById(ticketId: string) {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { ticket: null, messages: [] };
  }

  const supabase = createServiceRoleClient();
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    console.error("getAdminSupportTicketById error:", error);
    return { ticket: null, messages: [] };
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  let userDisplay = ticket.user_email || null;
  if (ticket.user_id) {
    const { data: userData } = await supabase
      .schema("core")
      .from("users")
      .select("first_name, last_name")
      .eq("id", ticket.user_id)
      .single();
    const { data: authData } = await supabase.auth.admin.getUserById(ticket.user_id);
    const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ").trim();
    userDisplay = name || authData?.user?.email || userDisplay;
  }

  return {
    ticket: { ...ticket, user_display: userDisplay },
    messages: messages ?? [],
  };
}

export async function addAdminTicketMessage(params: {
  ticketId: string;
  message: string;
  status?: SupportTicketStatus;
}) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return { success: false, error: "No autenticado." };
  }

  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { success: false, error: "No autorizado." };
  }

  const messageText = params.message.trim();
  if (!messageText) {
    return { success: false, error: "El mensaje no puede estar vacío." };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: ticket } = await serviceSupabase
    .from("support_tickets")
    .select("*")
    .eq("id", params.ticketId)
    .single();

  if (!ticket) {
    return { success: false, error: "Ticket no encontrado." };
  }

  const { error } = await serviceSupabase.from("ticket_messages").insert({
    ticket_id: params.ticketId,
    sender_type: "admin",
    sender_id: user.id,
    message_text: messageText,
    message_html: messageText.replace(/\n/g, "<br>"),
    is_internal: false,
    email_sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("addAdminTicketMessage error:", error);
    return { success: false, error: "No pudimos enviar la respuesta." };
  }

  if (params.status) {
    await serviceSupabase
      .from("support_tickets")
      .update({
        status: params.status,
        resolved_at: params.status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", params.ticketId);
  }

  const platformOrgId = await getPlatformOrganizationId();
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tupatrimonio.app"}/dashboard/support/tickets/${params.ticketId}`;

  const toEmail = ticket.user_email;
  if (platformOrgId && toEmail) {
    await sendSupportTicketNotification({
      organizationId: platformOrgId,
      toEmail,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      messageText,
      ticketUrl,
    });
  }

  return { success: true };
}
