/**
 * Módulo de Sincronización de Gmail
 *
 * Sincroniza emails entrantes desde Gmail API y los procesa
 * para crear tickets automáticamente o actualizar tickets existentes
 */

import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getOAuth2Client, getSharedGmailAccount } from "./client";

/**
 * Interfaz para email parseado desde Gmail
 */
export interface ParsedEmail {
  messageId: string; // Gmail message ID (interno)
  headerMessageId?: string; // Message-ID del header del email (para threading)
  threadId: string;
  from: string;
  fromEmail: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  snippet: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
  hasAttachments: boolean;
  labels: string[];
}

/**
 * Parsea headers de un mensaje de Gmail
 */
export function parseEmailHeaders(message: any): {
  from: string;
  fromEmail: string;
  fromName?: string;
  to: string[];
  cc: string[];
  subject: string;
  date: Date;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
} {
  const headers = message.payload?.headers || [];

  const getHeader = (name: string): string | undefined => {
    const header = headers.find((h: any) =>
      h.name?.toLowerCase() === name.toLowerCase()
    );
    return header?.value;
  };

  const fromHeader = getHeader("From") || "";
  const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$|^(.+?)$/);
  const fromName = fromMatch?.[1] || fromMatch?.[3] || undefined;
  const fromEmail = fromMatch?.[2] || fromMatch?.[3] || fromHeader;

  const toHeader = getHeader("To") || "";
  const toEmails = toHeader.split(",").map((e: string) => {
    const match = e.trim().match(/<(.+?)>|(.+)/);
    return match?.[1] || match?.[2] || e.trim();
  }).filter(Boolean);

  const ccHeader = getHeader("Cc") || "";
  const ccEmails = ccHeader.split(",").map((e: string) => {
    const match = e.trim().match(/<(.+?)>|(.+)/);
    return match?.[1] || match?.[2] || e.trim();
  }).filter(Boolean);

  const subject = getHeader("Subject") || "(Sin asunto)";
  const dateStr = getHeader("Date");
  const date = dateStr ? new Date(dateStr) : new Date(
    message.internalDate ? parseInt(message.internalDate) : Date.now(),
  );

  // Extraer Message-ID (crucial para threading)
  const messageIdHeader = getHeader("Message-ID");
  // Normalizar: remover <> si existen
  const messageId = messageIdHeader
    ? messageIdHeader.replace(/^<|>$/g, "").trim()
    : undefined;

  const inReplyTo = getHeader("In-Reply-To");
  // Normalizar In-Reply-To: remover <> si existen
  const normalizedInReplyTo = inReplyTo
    ? inReplyTo.replace(/^<|>$/g, "").trim()
    : undefined;

  const references = getHeader("References")?.split(/\s+/)
    .map((ref) => ref.replace(/^<|>$/g, "").trim())
    .filter(Boolean) || [];

  return {
    from: fromHeader,
    fromEmail,
    fromName,
    to: toEmails,
    cc: ccEmails,
    subject,
    date,
    messageId,
    inReplyTo: normalizedInReplyTo,
    references,
  };
}

/**
 * Extrae el cuerpo del email (HTML y texto)
 */
function extractEmailBody(part: any): { html: string; text: string } {
  let html = "";
  let text = "";

  if (part.mimeType === "text/html") {
    const data = part.body?.data;
    if (data) {
      html = Buffer.from(data, "base64").toString("utf-8");
    }
  } else if (part.mimeType === "text/plain") {
    const data = part.body?.data;
    if (data) {
      text = Buffer.from(data, "base64").toString("utf-8");
    }
  }

  // Si hay partes anidadas (multipart)
  if (part.parts) {
    for (const subPart of part.parts) {
      const result = extractEmailBody(subPart);
      if (result.html) html = result.html;
      if (result.text) text = result.text;
    }
  }

  return { html, text };
}

/**
 * Parsea un mensaje completo de Gmail
 */
export function parseGmailMessage(message: any): ParsedEmail {
  const headers = parseEmailHeaders(message);
  const body = extractEmailBody(message.payload);

  const snippet = message.snippet || "";
  const hasAttachments =
    message.payload?.parts?.some((p: any) =>
      p.filename && p.body?.attachmentId
    ) || false;

  const labels = message.labelIds || [];

  return {
    messageId: message.id,
    headerMessageId: headers.messageId,
    threadId: message.threadId,
    from: headers.from,
    fromEmail: headers.fromEmail,
    fromName: headers.fromName,
    to: headers.to,
    cc: headers.cc,
    subject: headers.subject,
    bodyHtml: body.html || body.text || "",
    bodyText: body.text || body.html?.replace(/<[^>]*>/g, "") || "",
    snippet,
    date: headers.date,
    inReplyTo: headers.inReplyTo,
    references: headers.references,
    hasAttachments,
    labels,
  };
}

/**
 * Obtiene emails no leídos del inbox de Gmail
 *
 * @param organizationId - ID de la organización
 * @param maxResults - Máximo número de resultados
 * @param includeRead - Si incluir emails leídos también (para testing)
 */
export async function getUnreadEmails(
  organizationId: string,
  maxResults: number = 50,
  includeRead: boolean = false,
): Promise<ParsedEmail[]> {
  const account = await getSharedGmailAccount(organizationId);
  if (!account || !account.tokens) {
    throw new Error(
      "No hay cuenta Gmail compartida configurada o tokens inválidos",
    );
  }

  const client = getOAuth2Client();

  // Refrescar token si es necesario
  if (account.tokens.expiry_date && account.tokens.expiry_date < Date.now()) {
    client.setCredentials({
      refresh_token: account.tokens.refresh_token,
    });
    const { credentials } = await client.refreshAccessToken();
    account.tokens.access_token = credentials.access_token;
    account.tokens.expiry_date = credentials.expiry_date;
  }

  client.setCredentials({
    access_token: account.tokens.access_token,
  });

  const gmail = google.gmail({ version: "v1", auth: client });

  // Obtener lista de mensajes
  // Buscar en todos los correos (no solo inbox) para capturar correos archivados o en otras carpetas
  // Limitar a correos de los últimos 30 días para evitar obtener correos muy antiguos
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateQuery = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;

  const query = includeRead
    ? `${dateQuery} -in:spam -in:trash` // Todos los correos recientes excepto spam y papelera
    : `${dateQuery} is:unread -in:spam -in:trash`; // Solo no leídos recientes

  console.log(`📧 Buscando emails con query: "${query}"...`);
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  console.log("📊 Respuesta de Gmail API:", {
    resultSizeEstimate: listResponse.data.resultSizeEstimate,
    messagesCount: listResponse.data.messages?.length || 0,
  });

  const messages = listResponse.data.messages || [];
  const parsedEmails: ParsedEmail[] = [];

  if (messages.length === 0 && !includeRead) {
    console.log(
      "⚠️ No se encontraron mensajes no leídos. Intentando buscar todos los emails recientes...",
    );
    // Intentar sin el filtro is:unread para debug
    const allResponse = await gmail.users.messages.list({
      userId: "me",
      q: `${dateQuery} -in:spam -in:trash`,
      maxResults: 10,
    });
    console.log("📊 Todos los emails recientes:", {
      resultSizeEstimate: allResponse.data.resultSizeEstimate,
      messagesCount: allResponse.data.messages?.length || 0,
    });
  }

  // Obtener detalles de cada mensaje
  for (const msg of messages) {
    if (!msg.id) continue;

    try {
      const messageResponse = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const parsed = parseGmailMessage(messageResponse.data);
      // console.log(`✅ Email parseado: ${parsed.fromEmail} - ${parsed.subject}`)
      parsedEmails.push(parsed);
    } catch (error) {
      console.error(`❌ Error obteniendo mensaje ${msg.id}:`, error);
    }
  }

  console.log(`📬 Total de emails parseados: ${parsedEmails.length}`);
  return parsedEmails;
}

/**
 * Verifica si un thread ya tiene un ticket asociado
 * Usa función RPC que busca directamente en crm.emails
 * Si la RPC falla, usa query directa como fallback
 */
export async function getTicketForThread(
  organizationId: string,
  gmailThreadId: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Intentar usar RPC function
  const { data: ticketId, error } = await supabase.rpc(
    "get_ticket_for_gmail_thread",
    {
      p_organization_id: organizationId,
      p_gmail_thread_id: gmailThreadId,
    },
  );

  if (error) {
    console.error(
      "⚠️ Error en get_ticket_for_gmail_thread RPC:",
      error.message,
    );
    console.log("🔄 Usando fallback: query directa a emails");

    // Fallback: buscar directamente en la tabla emails
    // Primero verificar cuántos emails existen con este thread_id
    const { data: allEmailsWithThread, error: countError } = await supabase
      .from("emails")
      .select("id, ticket_id, direction, subject")
      .eq("organization_id", organizationId)
      .eq("thread_id", gmailThreadId);

    if (countError) {
      console.error(
        "❌ Error buscando emails con thread_id:",
        countError.message,
      );
    } else {
      console.log(
        `🔍 Emails con thread_id ${gmailThreadId}: ${
          allEmailsWithThread?.length || 0
        }`,
      );
      if (allEmailsWithThread && allEmailsWithThread.length > 0) {
        allEmailsWithThread.forEach((e) => {
          console.log(
            `   - Email ${e.id}: direction=${e.direction}, ticket_id=${
              e.ticket_id || "null"
            }, subject="${e.subject}"`,
          );
        });
      }
    }

    const { data: emailWithTicket, error: queryError } = await supabase
      .from("emails")
      .select("ticket_id")
      .eq("organization_id", organizationId)
      .eq("thread_id", gmailThreadId)
      .not("ticket_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error("❌ Error en fallback query:", queryError.message);
      return null;
    }

    if (emailWithTicket?.ticket_id) {
      console.log(`✅ Fallback encontró ticket: ${emailWithTicket.ticket_id}`);
      return emailWithTicket.ticket_id;
    }

    console.log(`📭 No se encontró ticket para thread_id: ${gmailThreadId}`);
    return null;
  }

  if (ticketId) {
    console.log(`✅ RPC encontró ticket: ${ticketId}`);
    return ticketId;
  }

  console.log(
    `📭 RPC no encontró ticket para thread_id: ${gmailThreadId}, intentando búsqueda manual en email_threads...`,
  );

  // Fallback IMPORTANTE: Buscar primero el thread y ver si tiene ticket asociado
  try {
    const { data: thread } = await supabase
      .from("email_threads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("gmail_thread_id", gmailThreadId)
      .single();

    if (thread) {
      console.log(
        `🔍 Thread encontrado en BD: ${thread.id}, buscando ticket asociado...`,
      );
      const { data: ticket } = await supabase
        .from("tickets")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("source_email_thread_id", thread.id)
        .single();

      if (ticket) {
        console.log(
          `✅ TICKET ENCONTRADO por relación directa con thread: ${ticket.id}`,
        );
        return ticket.id;
      } else {
        console.log(
          `⚠️ Thread existe pero no tiene ticket asociado en source_email_thread_id`,
        );
      }
    }
  } catch (err) {
    console.error("Error en búsqueda manual de thread:", err);
  }

  console.log("🔄 Usando fallback final: query directa a emails");

  // Fallback: buscar directamente en la tabla emails
}

/**
 * Busca un ticket existente por subject y contacto
 * Útil para evitar crear tickets duplicados cuando el mismo contacto envía emails con el mismo asunto
 */
export async function findExistingTicketBySubjectAndContact(
  organizationId: string,
  subject: string,
  contactEmail: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Intentar usar RPC function
  const { data: ticketId, error } = await supabase.rpc(
    "get_ticket_for_contact_subject",
    {
      p_organization_id: organizationId,
      p_contact_email: contactEmail,
      p_subject: subject,
    },
  );

  if (error) {
    console.error(
      "⚠️ Error en get_ticket_for_contact_subject RPC:",
      error.message,
    );
    console.log("🔄 Usando fallback: query directa");

    // Fallback: buscar contacto y luego ticket por subject similar
    // Primero encontrar el contacto
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("email", contactEmail)
      .maybeSingle();

    if (!contact) {
      console.log(`📭 No se encontró contacto con email: ${contactEmail}`);
      return null;
    }

    // Limpiar subject (quitar Re:, Fwd:, etc.)
    const cleanSubject = subject.replace(
      /^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*/gi,
      "",
    ).trim();
    console.log(`🔍 Buscando ticket con subject limpio: "${cleanSubject}"`);

    // Buscar ticket con subject similar
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, subject")
      .eq("organization_id", organizationId)
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: true })
      .limit(10);

    if (ticketError) {
      console.error("❌ Error buscando tickets:", ticketError.message);
      return null;
    }

    // Buscar coincidencia de subject
    for (const t of ticket || []) {
      const ticketCleanSubject = t.subject.replace(
        /^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*/gi,
        "",
      ).trim();
      if (
        ticketCleanSubject.toLowerCase() === cleanSubject.toLowerCase() ||
        ticketCleanSubject.toLowerCase().includes(cleanSubject.toLowerCase()) ||
        cleanSubject.toLowerCase().includes(ticketCleanSubject.toLowerCase())
      ) {
        console.log(
          `✅ Fallback encontró ticket por subject: ${t.id} (subject: "${t.subject}")`,
        );
        return t.id;
      }
    }

    console.log(
      `📭 No se encontró ticket con subject similar para contacto ${contactEmail}`,
    );
    return null;
  }

  if (ticketId) {
    console.log(`✅ RPC encontró ticket por subject/contacto: ${ticketId}`);
  } else {
    console.log(
      `📭 RPC no encontró ticket para subject: "${subject}" y contacto: ${contactEmail}`,
    );
  }

  return ticketId || null;
}

/**
 * Busca o crea un contacto por email
 */
export async function findOrCreateContact(
  organizationId: string,
  email: string,
  name?: string,
): Promise<string> {
  const supabase = createServiceRoleClient();

  // Buscar contacto existente
  const { data: existingContact } = await supabase
    .from("contacts")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("email", email.toLowerCase())
    .single();

  if (existingContact) {
    return existingContact.id;
  }

  // Crear nuevo contacto
  const nameParts = name?.split(" ") || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || null;

  const { data: newContact, error } = await supabase
    .from("contacts")
    .insert({
      organization_id: organizationId,
      email: email.toLowerCase(),
      first_name: firstName || null,
      last_name: lastName || null,
      status: "lead",
      source: "email",
    })
    .select("id")
    .single();

  if (error || !newContact) {
    throw new Error(
      `Error creando contacto: ${error?.message || "Unknown error"}`,
    );
  }

  return newContact.id;
}
