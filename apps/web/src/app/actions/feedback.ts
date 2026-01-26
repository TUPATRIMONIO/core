"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getActiveOrganizationId } from "@/lib/organization/get-active-org";

export type FeedbackType = "error" | "improvement";
export type FeedbackStatus = "pending" | "reviewing" | "resolved" | "rejected";

interface SubmitFeedbackPayload {
  type: FeedbackType;
  title: string;
  description: string;
  url?: string;
  userAgent?: string;
  userEmail?: string;
}

async function isPlatformAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_platform_admin");
  return data === true;
}

export async function submitFeedback(payload: SubmitFeedbackPayload) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    if (!userId && !payload.userEmail) {
      return { success: false, error: "Correo requerido para usuarios sin sesión." };
    }

    const { data: feedbackRow, error } = await supabase
      .from("user_feedback")
      .insert({
        type: payload.type,
        title: payload.title,
        description: payload.description,
        url: payload.url,
        user_agent: payload.userAgent,
        user_id: userId,
        user_email: userId ? null : payload.userEmail,
      })
      .select("id")
      .single();

    if (error) {
      console.error("submitFeedback error:", error);
      return { success: false, error: "No pudimos guardar tu mensaje." };
    }

    // Crear ticket de soporte automáticamente
    const serviceSupabase = createServiceRoleClient();
    let organizationId: string | null = null;

    if (userId) {
      const orgResult = await getActiveOrganizationId(supabase, userId);
      organizationId = orgResult.organizationId;
    }

    const { data: supportTicket, error: ticketError } = await serviceSupabase
      .from("crm_tickets")
      .insert({
        user_id: userId,
        user_email: userId ? authData?.user?.email ?? null : payload.userEmail,
        subject: payload.title,
        description: payload.description,
        source: "feedback",
        source_feedback_id: feedbackRow?.id,
        organization_id: organizationId,
        priority: "medium",
        status: "open",
      })
      .select("id")
      .single();

    if (ticketError) {
      console.error("Error creando ticket de soporte:", ticketError);
      return { success: true };
    }

    const messageText = payload.description.trim();
    await serviceSupabase
      .from("crm_ticket_messages")
      .insert({
        ticket_id: supportTicket?.id,
        sender_type: "user",
        sender_id: userId,
        message_text: messageText,
        message_html: messageText.replace(/\n/g, "<br>"),
        is_internal: false,
      });

    // Crear asociación automática del usuario con el ticket
    if (userId && supportTicket?.id) {
      await serviceSupabase
        .from("crm_ticket_users")
        .insert({
          ticket_id: supportTicket.id,
          user_id: userId,
        });
    }

    return { success: true };
  } catch (error: any) {
    console.error("submitFeedback error:", error);
    return { success: false, error: "Error inesperado al enviar el feedback." };
  }
}

export async function getFeedbackList(params: {
  status?: FeedbackStatus;
  type?: FeedbackType;
  limit?: number;
  offset?: number;
}) {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { items: [], total: 0 };
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("user_feedback")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (typeof params.offset === "number" && typeof params.limit === "number") {
    query = query.range(params.offset, params.offset + params.limit - 1);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("getFeedbackList error:", error);
    return { items: [], total: 0 };
  }

  const items = data ?? [];
  const userIds = [...new Set(items.map((item) => item.user_id).filter(Boolean))] as string[];

  if (userIds.length === 0) {
    return { items, total: count ?? 0 };
  }

  const { data: usersData } = await supabase
    .schema("core")
    .from("users")
    .select("id, first_name, last_name")
    .in("id", userIds);

  const userMap = new Map(
    (usersData ?? []).map((user) => [
      user.id,
      {
        name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
      },
    ])
  );

  const emailEntries = await Promise.all(
    userIds.map(async (userId) => {
      const { data: authData } = await supabase.auth.admin.getUserById(userId);
      return [userId, authData?.user?.email ?? ""] as const;
    })
  );

  const emailMap = new Map(emailEntries);

  const enrichedItems = items.map((item) => {
    const userInfo = item.user_id ? userMap.get(item.user_id) : null;
    const email = item.user_id ? emailMap.get(item.user_id) : null;
    return {
      ...item,
      user_display: userInfo?.name || email || item.user_email || null,
      user_email_resolved: email || item.user_email || null,
    };
  });

  return { items: enrichedItems, total: count ?? 0 };
}

export async function getFeedbackById(id: string) {
  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { data: null };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getFeedbackById error:", error);
    return { data: null };
  }

  const { data: linkedTicket } = await supabase
    .from("crm_tickets")
    .select("id, ticket_number")
    .eq("source_feedback_id", data.id)
    .maybeSingle();

  if (!data?.user_id) {
    return {
      data: {
        ...data,
        support_ticket_id: linkedTicket?.id ?? null,
        support_ticket_number: linkedTicket?.ticket_number ?? null,
      },
    };
  }

  const { data: userData } = await supabase
    .schema("core")
    .from("users")
    .select("id, first_name, last_name")
    .eq("id", data.user_id)
    .single();

  const { data: authData } = await supabase.auth.admin.getUserById(data.user_id);

  const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ").trim();
  const email = authData?.user?.email ?? null;

  return {
    data: {
      ...data,
      user_display: name || email || data.user_email || null,
      user_email_resolved: email || data.user_email || null,
      support_ticket_id: linkedTicket?.id ?? null,
      support_ticket_number: linkedTicket?.ticket_number ?? null,
    },
  };
}

export async function respondToFeedback(params: {
  id: string;
  status: FeedbackStatus;
  adminResponse: string;
}) {
  const supabaseAuth = await createClient();
  const { data: authData } = await supabaseAuth.auth.getUser();

  const isAdmin = await isPlatformAdmin();
  if (!isAdmin) {
    return { success: false, error: "No autorizado." };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("user_feedback")
    .update({
      status: params.status,
      admin_response: params.adminResponse,
      responded_by: authData?.user?.id ?? null,
      responded_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    console.error("respondToFeedback error:", error);
    return { success: false, error: "No pudimos actualizar el feedback." };
  }

  return { success: true };
}
