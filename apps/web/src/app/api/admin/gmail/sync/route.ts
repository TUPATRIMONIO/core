import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  findExistingTicketBySubjectAndContact,
  findOrCreateContact,
  getTicketForThread,
  getUnreadEmails,
  ParsedEmail,
} from "@/lib/gmail/sync";

/**
 * API Route: Sincronizar emails entrantes de Gmail
 *
 * POST /api/admin/gmail/sync
 *
 * Sincroniza emails no leídos del inbox y crea/actualiza tickets automáticamente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      );
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc("is_platform_admin");
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: "Solo los platform admins pueden sincronizar emails" },
        { status: 403 },
      );
    }

    // Obtener organización platform
    const { data: platformOrg } = await supabase
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

    // Obtener emails (primero intentar solo no leídos, si no hay resultados, incluir leídos)
    console.log("🔄 Iniciando sincronización de emails...");
    let unreadEmails = await getUnreadEmails(organizationId, 50, false);
    console.log(`📧 Emails no leídos obtenidos: ${unreadEmails.length}`);

    // Si no hay emails no leídos, intentar con todos los emails del inbox (últimos 20)
    if (unreadEmails.length === 0) {
      console.log(
        "⚠️ No hay emails no leídos. Intentando con todos los emails del inbox...",
      );
      unreadEmails = await getUnreadEmails(organizationId, 20, true);
      console.log(
        `📧 Total de emails obtenidos (incluyendo leídos): ${unreadEmails.length}`,
      );
    }

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
        // Usar RPC o query directa a crm.emails para evitar problemas de permisos
        const { data: existingEmails, error: existingEmailError } =
          await serviceSupabase
            .rpc("check_email_exists", {
              p_organization_id: organizationId,
              p_gmail_message_id: email.messageId,
            });

        // Fallback si la función RPC no existe
        let emailExists = existingEmails === true;
        if (existingEmailError) {
          console.log(
            "⚠️ RPC check_email_exists no existe, usando query directa",
          );
          const { data: directCheck } = await serviceSupabase
            .from("emails")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("gmail_message_id", email.messageId)
            .maybeSingle();
          emailExists = !!directCheck;
        }

        if (emailExists) {
          // Email ya existe en la BD, saltar completamente
          // console.log(`⏭️ Email ${email.messageId} ya existe en BD. Saltando.`)
          results.processed++;
          continue;
        }

        // PASO 2: Verificar si este thread ya tiene ticket
        console.log(
          `🔍 Buscando ticket para thread_id: ${email.threadId} (email: ${email.subject})`,
        );
        const existingTicketIdByThread = await getTicketForThread(
          organizationId,
          email.threadId,
        );
        console.log(
          `🔍 Resultado getTicketForThread: ${
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
              `📧 Email ${email.messageId} pertenece a thread existente, agregando a ticket ${existingTicketIdByThread}`,
            );
            const result = await updateTicketWithEmail(
              serviceSupabase,
              existingTicketIdByThread,
              email,
              organizationId,
              user.id,
            );
            if (result === "created") {
              results.ticketsCreated++;
            } else {
              results.ticketsUpdated++;
            }
            results.processed++;
            continue;
          } else {
            console.log(
              `⚠️ Ticket ${existingTicketIdByThread} no existe, continuando con otras verificaciones...`,
            );
          }
        }

        // PASO 3: Verificar si hay un ticket existente con el mismo subject del mismo contacto
        console.log(
          `🔍 Buscando ticket por subject: "${email.subject}" y contacto: ${email.fromEmail}`,
        );
        const existingTicketIdBySubject =
          await findExistingTicketBySubjectAndContact(
            organizationId,
            email.subject,
            email.fromEmail,
          );
        console.log(
          `🔍 Resultado findExistingTicketBySubjectAndContact: ${
            existingTicketIdBySubject || "null"
          }`,
        );

        if (existingTicketIdBySubject) {
          console.log(
            `📧 Email ${email.messageId} tiene subject similar a ticket existente ${existingTicketIdBySubject}, agregando al ticket`,
          );
          const result = await updateTicketWithEmail(
            serviceSupabase,
            existingTicketIdBySubject,
            email,
            organizationId,
            user.id,
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
          `🆕 Creando nuevo ticket para email ${email.messageId} (subject: ${email.subject})`,
        );
        await createTicketFromEmail(
          serviceSupabase,
          email,
          organizationId,
          user.id,
        );
        results.ticketsCreated++;
        results.processed++;
      } catch (error: any) {
        console.error(`Error procesando email ${email.messageId}:`, error);
        results.errors.push(`Email ${email.messageId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message:
        `Procesados ${results.processed} emails. ${results.ticketsCreated} tickets creados, ${results.ticketsUpdated} actualizados.`,
    });
  } catch (error: any) {
    console.error("Error sincronizando Gmail:", error);
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

  // --- SAFETY CHECK: Verificar si este thread YA tiene un ticket asociado para evitar duplicados ---
  const { data: existingTicketForThread } = await supabase
    .from("tickets")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("source_email_thread_id", threadId)
    .maybeSingle();

  if (existingTicketForThread) {
    console.log(
      `🛑 SAFETY CHECK: El thread ${threadId} YA tiene el ticket ${existingTicketForThread.id}. Retornando existente.`,
    );
    return existingTicketForThread.id;
  }
  // -----------------------------------------------------------------------------------------------

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
    console.log(`⏭️ Email ${email.messageId} ya existe en BD`);
    // Si el email existe pero no tiene ticket_id, actualizarlo
    if (!existingEmail.ticket_id) {
      await supabase
        .from("emails")
        .update({ ticket_id: finalTicketId, thread_id_crm: threadId })
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
        ticket_id: finalTicketId,
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

  return finalTicketId;
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
    .select("contact_id, source_email_thread_id")
    .eq("id", ticketId)
    .single();

  // Si el ticket no existe, crear uno nuevo
  if (!ticket) {
    console.log(`⚠️ Ticket ${ticketId} no encontrado, creando nuevo ticket...`);
    await createTicketFromEmail(supabase, email, organizationId, userId);
    return "created";
  }

  // Buscar o crear thread
  let threadId = ticket.source_email_thread_id;
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
      `⏭️ Email ${email.messageId} ya existe en BD, saltando inserción`,
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
