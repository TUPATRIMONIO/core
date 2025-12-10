import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  findExistingTicketBySubjectAndContact,
  findOrCreateContact,
  getTicketForThread,
  getUnreadEmails,
  ParsedEmail,
} from "@/lib/gmail/sync";

/**
 * API Route: Cron job para sincronizar emails automáticamente
 *
 * GET /api/cron/sync-emails
 *
 * Esta ruta es llamada por Vercel Cron cada 5 minutos
 * Verifica CRON_SECRET para seguridad
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que viene de Vercel Cron
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("⚠️ CRON_SECRET no configurado en variables de entorno");
      return NextResponse.json(
        { error: "CRON_SECRET no configurado" },
        { status: 500 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ Intento de acceso no autorizado al cron job");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Obtener organización platform
    const { data: platformOrg } = await serviceSupabase
      .from("organizations")
      .select("id")
      .eq("org_type", "platform")
      .eq("status", "active")
      .single();

    if (!platformOrg) {
      return NextResponse.json(
        { error: "No se encontró la organización platform" },
        { status: 404 },
      );
    }

    const organizationId = platformOrg.id;

    // Obtener un usuario platform admin para usar como created_by
    // Usamos el primer usuario admin que encontremos
    const { data: adminUser } = await serviceSupabase
      .from("users")
      .select("id")
      .eq("organization_id", organizationId)
      .limit(1)
      .single();

    const userId = adminUser?.id || organizationId; // Fallback al organizationId si no hay usuario

    // Obtener emails (solo no leídos para el cron)
    console.log("🔄 [CRON] Iniciando sincronización automática de emails...");
    const unreadEmails = await getUnreadEmails(organizationId, 50, false);
    console.log(`📧 [CRON] Emails no leídos obtenidos: ${unreadEmails.length}`);

    const results = {
      processed: 0,
      ticketsCreated: 0,
      ticketsUpdated: 0,
      errors: [] as string[],
    };

    // Procesar cada email
    for (const email of unreadEmails) {
      try {
        // PASO 1: Verificar si este email ya fue procesado (por gmail_message_id)
        // Si existe, SIEMPRE saltar, independientemente de si tiene ticket_id
        const { data: existingEmail } = await serviceSupabase
          .from("emails")
          .select("ticket_id, id")
          .eq("organization_id", organizationId)
          .eq("gmail_message_id", email.messageId)
          .single();

        if (existingEmail) {
          // Email ya existe en la BD, saltar completamente
          console.log(
            `[CRON] ⏩ Email ${email.messageId} ya existe en BD${
              existingEmail.ticket_id
                ? `, asociado a ticket ${existingEmail.ticket_id}`
                : ""
            }. Saltando.`,
          );
          results.processed++;
          continue;
        }

        // PASO 2: Verificar si este thread ya tiene ticket
        console.log(
          `[CRON] 🔍 Buscando ticket para thread_id: ${email.threadId} (email: ${email.subject})`,
        );
        const existingTicketIdByThread = await getTicketForThread(
          organizationId,
          email.threadId,
        );
        console.log(
          `[CRON] 🔍 Resultado getTicketForThread: ${
            existingTicketIdByThread || "null"
          }`,
        );

        if (existingTicketIdByThread) {
          // Verificar que el ticket realmente existe
          const { data: ticketCheck } = await serviceSupabase
            .from("tickets")
            .select("id")
            .eq("id", existingTicketIdByThread)
            .single();

          if (ticketCheck) {
            console.log(
              `[CRON] 📧 Email ${email.messageId} pertenece a thread existente, agregando a ticket ${existingTicketIdByThread}`,
            );
            const result = await updateTicketWithEmail(
              serviceSupabase,
              existingTicketIdByThread,
              email,
              organizationId,
              userId,
            );
            if (result === "created") {
              results.ticketsCreated++;
            } else {
              results.ticketsUpdated++;
            }
            results.processed++;
            continue;
          }
        }

        // PASO 3: Verificar si hay un ticket existente con el mismo subject del mismo contacto
        const existingTicketIdBySubject =
          await findExistingTicketBySubjectAndContact(
            organizationId,
            email.subject,
            email.fromEmail,
          );

        if (existingTicketIdBySubject) {
          console.log(
            `[CRON] 📧 Email ${email.messageId} tiene subject similar a ticket existente ${existingTicketIdBySubject}, agregando al ticket`,
          );
          const result = await updateTicketWithEmail(
            serviceSupabase,
            existingTicketIdBySubject,
            email,
            organizationId,
            userId,
          );
          if (result === "created") {
            results.ticketsCreated++;
          } else {
            results.ticketsUpdated++;
          }
          results.processed++;
          continue;
        }

        // PASO 4: No se encontró ticket existente, crear uno nuevo
        console.log(
          `[CRON] 🆕 Creando nuevo ticket para email ${email.messageId} (subject: ${email.subject})`,
        );
        await createTicketFromEmail(
          serviceSupabase,
          email,
          organizationId,
          userId,
        );
        results.ticketsCreated++;
        results.processed++;
      } catch (error: any) {
        console.error(
          `❌ [CRON] Error procesando email ${email.messageId}:`,
          error,
        );
        results.errors.push(`Email ${email.messageId}: ${error.message}`);
      }
    }

    console.log(
      `✅ [CRON] Sincronización completada: ${results.processed} procesados, ${results.ticketsCreated} creados, ${results.ticketsUpdated} actualizados`,
    );

    return NextResponse.json({
      success: true,
      results,
      message:
        `Procesados ${results.processed} emails. ${results.ticketsCreated} tickets creados, ${results.ticketsUpdated} actualizados.`,
    });
  } catch (error: any) {
    console.error("❌ [CRON] Error sincronizando Gmail:", error);
    return NextResponse.json(
      { error: error.message || "Error al sincronizar emails" },
      { status: 500 },
    );
  }
}

/**
 * Crea un nuevo ticket desde un email entrante
 */
async function createTicketFromEmail(
  supabase: any,
  email: ParsedEmail,
  organizationId: string,
  userId: string,
) {
  // Buscar o crear contacto
  const contactId = await findOrCreateContact(
    organizationId,
    email.fromEmail,
    email.fromName,
  );

  // Crear o actualizar email_thread
  const { data: thread } = await supabase
    .from("email_threads")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("gmail_thread_id", email.threadId)
    .single();

  let threadId: string;
  if (thread) {
    threadId = thread.id;
  } else {
    const { data: newThread, error: threadError } = await supabase
      .from("email_threads")
      .insert({
        organization_id: organizationId,
        gmail_thread_id: email.threadId,
        contact_id: contactId,
        subject: email.subject,
        snippet: email.snippet,
        participants: [email.fromEmail, ...email.to],
        last_email_at: email.date.toISOString(),
        last_email_from: email.fromEmail,
        email_count: 1,
      })
      .select("id")
      .single();

    if (threadError || !newThread) {
      throw new Error(
        `Error creando thread: ${threadError?.message || "Unknown error"}`,
      );
    }
    threadId = newThread.id;
  }

  // Generar número de ticket
  const { data: lastTicket } = await supabase
    .from("tickets")
    .select("ticket_number")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let ticketNumber = "TICK-00001";
  if (lastTicket?.ticket_number) {
    const match = lastTicket.ticket_number.match(/TICK-(\d+)/);
    if (match) {
      const num = parseInt(match[1]) + 1;
      ticketNumber = `TICK-${num.toString().padStart(5, "0")}`;
    }
  }

  // Crear ticket
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      organization_id: organizationId,
      ticket_number: ticketNumber,
      subject: email.subject,
      description: email.bodyText || email.snippet,
      status: "new",
      priority: "medium",
      category: "general",
      contact_id: contactId,
      created_by: userId,
      source_email_thread_id: threadId,
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    throw new Error(
      `Error creando ticket: ${ticketError?.message || "Unknown error"}`,
    );
  }

  // Verificar si el email ya existe antes de insertarlo
  const { data: existingEmail } = await supabase
    .from("emails")
    .select("id, ticket_id")
    .eq("organization_id", organizationId)
    .eq("gmail_message_id", email.messageId)
    .single();

  if (existingEmail) {
    console.log(`⏭️ [CRON] Email ${email.messageId} ya existe en BD`);
    // Si el email existe pero no tiene ticket_id, actualizarlo
    if (!existingEmail.ticket_id) {
      await supabase
        .from("emails")
        .update({ ticket_id: ticket.id, thread_id_crm: threadId })
        .eq("id", existingEmail.id);
    }
  } else {
    // Obtener cuenta Gmail compartida para received_in_account_id
    const { data: gmailAccount } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("account_type", "shared")
      .eq("is_active", true)
      .single();

    // Crear registro de email
    const { error: emailError } = await supabase
      .from("emails")
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        ticket_id: ticket.id,
        thread_id_crm: threadId,
        gmail_message_id: email.messageId,
        message_id: email.headerMessageId || null,
        thread_id: email.threadId,
        from_email: email.fromEmail,
        to_emails: email.to,
        cc_emails: email.cc || [],
        subject: email.subject,
        body_html: email.bodyHtml,
        body_text: email.bodyText,
        direction: "inbound",
        status: "delivered",
        sent_at: email.date.toISOString(),
        is_read: false,
        snippet: email.snippet,
        has_attachments: email.hasAttachments,
        received_in_account_id: gmailAccount?.id || null,
        in_reply_to: email.inReplyTo || null,
        references: email.references || [],
      });

    if (emailError) {
      // Si es error de duplicado, ignorar (puede pasar en race conditions)
      if (emailError.code !== "23505") { // 23505 = unique_violation
        console.error("Error guardando email:", emailError);
        // No lanzar error, el ticket ya está creado
      }
    }
  }

  // Crear actividad
  await supabase
    .from("activities")
    .insert({
      organization_id: organizationId,
      contact_id: contactId,
      ticket_id: ticket.id,
      type: "email",
      subject: `Email recibido: ${email.subject}`,
      description: email.snippet || email.bodyText?.substring(0, 500),
      performed_by: userId,
      performed_at: email.date.toISOString(),
    });

  return ticket.id;
}

/**
 * Actualiza un ticket existente con un nuevo email
 * Si el ticket no existe, crea uno nuevo
 */
async function updateTicketWithEmail(
  supabase: any,
  ticketId: string,
  email: ParsedEmail,
  organizationId: string,
  userId: string,
): Promise<"created" | "updated"> {
  // Obtener ticket
  const { data: ticket } = await supabase
    .from("tickets")
    .select("contact_id, thread_id_crm")
    .eq("id", ticketId)
    .single();

  // Si el ticket no existe, crear uno nuevo
  if (!ticket) {
    console.log(`⚠️ Ticket ${ticketId} no encontrado, creando nuevo ticket...`);
    await createTicketFromEmail(supabase, email, organizationId, userId);
    return "created";
  }

  // Buscar o crear thread
  let threadId = ticket.thread_id_crm;
  if (!threadId) {
    const { data: thread } = await supabase
      .from("email_threads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("gmail_thread_id", email.threadId)
      .single();

    if (thread) {
      threadId = thread.id;
    } else {
      const contactId = ticket.contact_id || await findOrCreateContact(
        organizationId,
        email.fromEmail,
        email.fromName,
      );

      const { data: newThread, error: threadError } = await supabase
        .from("email_threads")
        .insert({
          organization_id: organizationId,
          gmail_thread_id: email.threadId,
          contact_id: contactId,
          subject: email.subject,
          snippet: email.snippet,
          participants: [email.fromEmail, ...email.to],
          last_email_at: email.date.toISOString(),
          last_email_from: email.fromEmail,
          email_count: 1,
        })
        .select("id")
        .single();

      if (!threadError && newThread) {
        threadId = newThread.id;
      }
    }
  }

  // Verificar si el email ya existe antes de insertarlo
  const { data: existingEmail } = await supabase
    .from("emails")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("gmail_message_id", email.messageId)
    .single();

  if (existingEmail) {
    console.log(
      `⏭️ [CRON] Email ${email.messageId} ya existe en BD, saltando inserción`,
    );
  } else {
    // Obtener cuenta Gmail compartida para received_in_account_id
    const { data: gmailAccount } = await supabase
      .from("email_accounts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("account_type", "shared")
      .eq("is_active", true)
      .single();

    // Crear registro de email
    const { error: emailInsertError } = await supabase
      .from("emails")
      .insert({
        organization_id: organizationId,
        contact_id: ticket.contact_id,
        ticket_id: ticketId,
        thread_id_crm: threadId,
        gmail_message_id: email.messageId,
        message_id: email.headerMessageId || null,
        thread_id: email.threadId,
        from_email: email.fromEmail,
        to_emails: email.to,
        cc_emails: email.cc || [],
        subject: email.subject,
        body_html: email.bodyHtml,
        body_text: email.bodyText,
        direction: "inbound",
        status: "delivered",
        sent_at: email.date.toISOString(),
        is_read: false,
        snippet: email.snippet,
        has_attachments: email.hasAttachments,
        received_in_account_id: gmailAccount?.id || null,
        in_reply_to: email.inReplyTo || null,
        references: email.references || [],
      });

    if (emailInsertError) {
      // Si es error de duplicado, ignorar (puede pasar en race conditions)
      if (emailInsertError.code !== "23505") { // 23505 = unique_violation
        console.error("Error insertando email:", emailInsertError);
      }
    }
  }

  // Actualizar ticket
  await supabase
    .from("tickets")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  // Crear actividad
  await supabase
    .from("activities")
    .insert({
      organization_id: organizationId,
      contact_id: ticket.contact_id,
      ticket_id: ticketId,
      type: "email",
      subject: `Nuevo email recibido: ${email.subject}`,
      description: email.snippet || email.bodyText?.substring(0, 500),
      performed_at: email.date.toISOString(),
    });

  return "updated";
}
