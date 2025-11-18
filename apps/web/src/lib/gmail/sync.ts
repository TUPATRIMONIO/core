/**
 * Gmail Sync Service
 * Sincroniza emails del inbox con el CRM
 */

import { google } from 'googleapis';
import { getAuthenticatedClient, refreshAccessToken } from './oauth';
import { fetchEmailsIMAP, type IMAPConfig } from '../email/imap-service';
import { decryptObject } from '../crypto';
import type { GmailTokens } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SyncResult {
  newEmails: number;
  updatedThreads: number;
  errors: string[];
}

interface ParsedEmail {
  gmail_message_id: string;
  gmail_thread_id: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body_html: string;
  body_text: string;
  snippet: string;
  date: string;
  in_reply_to?: string;
  references: string[];
  has_attachments: boolean;
  labels: string[];
}

/**
 * Sincroniza emails de una cuenta (OAuth o IMAP)
 */
export async function syncEmailsForAccount(
  supabase: SupabaseClient,
  accountId: string,
  organizationId: string,
  account: any, // Account completo con connection_type
  lastSyncAt?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    newEmails: 0,
    updatedThreads: 0,
    errors: []
  };

  try {
    // Detectar tipo de conexión
    if (account.connection_type === 'imap_smtp') {
      // Sincronizar vía IMAP
      return await syncEmailsViaIMAP(supabase, accountId, organizationId, account, lastSyncAt);
    }
    
    // Si es OAuth, continuar con Gmail API (código actual)
    const tokens = account.gmail_oauth_tokens || account;
    // Verificar y refrescar tokens si es necesario
    let currentTokens = tokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        currentTokens = await refreshAccessToken(tokens.refresh_token);
        
        // Actualizar tokens en BD
        await supabase
          .schema('crm')
          .from('email_accounts')
          .update({ gmail_oauth_tokens: currentTokens })
          .eq('id', accountId);
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    }

    const oauth2Client = getAuthenticatedClient(currentTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construir query de búsqueda
    let query = 'in:inbox OR in:sent';
    
    // Si hay lastSyncAt, solo buscar emails nuevos
    if (lastSyncAt) {
      const syncDate = new Date(lastSyncAt);
      const afterTimestamp = Math.floor(syncDate.getTime() / 1000);
      query += ` after:${afterTimestamp}`;
    }

    // Listar mensajes
    const { data: messageList } = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100 // Limitar para no sobrecargar
    });

    if (!messageList.messages || messageList.messages.length === 0) {
      console.log(`[Sync Account ${accountId}] No new messages`);
      return result;
    }

    console.log(`[Sync Account ${accountId}] Found ${messageList.messages.length} messages to process`);

    // Procesar cada mensaje
    for (const message of messageList.messages) {
      try {
        const parsed = await fetchAndParseEmail(gmail, message.id!);
        
        if (!parsed) continue;

        // Verificar si ya existe
        const { data: existing } = await supabase
          .schema('crm')
          .from('emails')
          .select('id')
          .eq('gmail_message_id', parsed.gmail_message_id)
          .eq('organization_id', organizationId)
          .single();

        if (existing) {
          continue; // Ya existe, skip
        }

        // Determinar dirección (inbound/outbound)
        const accountEmail = tokens.email || '';
        const isOutbound = parsed.from.toLowerCase().includes(accountEmail.toLowerCase());

        // Intentar match con contacto
        const contactEmail = isOutbound ? parsed.to[0] : parsed.from;
        const { data: contact } = await supabase
          .schema('crm')
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('email', contactEmail)
          .single();

        // Insertar email
        const emailData: any = {
          organization_id: organizationId,
          contact_id: contact?.id || null,
          gmail_message_id: parsed.gmail_message_id,
          thread_id: parsed.gmail_thread_id,
          from_email: parsed.from,
          to_emails: parsed.to,
          cc_emails: parsed.cc,
          subject: parsed.subject,
          body_html: parsed.body_html,
          body_text: parsed.body_text,
          snippet: parsed.snippet,
          direction: isOutbound ? 'outbound' : 'inbound',
          status: 'delivered',
          sent_at: parsed.date,
          labels: parsed.labels,
          has_attachments: parsed.has_attachments,
          in_reply_to: parsed.in_reply_to,
          references: parsed.references
        };

        if (isOutbound) {
          emailData.sent_from_account_id = accountId;
        } else {
          emailData.received_in_account_id = accountId;
        }

        const { data: insertedEmail, error: insertError } = await supabase
          .schema('crm')
          .from('emails')
          .insert(emailData)
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Failed to insert email ${parsed.gmail_message_id}: ${insertError.message}`);
        } else {
          result.newEmails++;
          
          // Si es email entrante, intentar vincularlo a un ticket por múltiples métodos
          if (!isOutbound && insertedEmail?.id) {
            let outboundEmail: any = null;
            
            // Método 1: Buscar por thread_id
            if (parsed.gmail_thread_id) {
              const { data } = await supabase
                .schema('crm')
                .from('emails')
                .select('ticket_id')
                .eq('thread_id', parsed.gmail_thread_id)
                .eq('direction', 'outbound')
                .eq('organization_id', organizationId)
                .not('ticket_id', 'is', null)
                .order('sent_at', { ascending: false })
                .limit(1)
                .single();
              
              outboundEmail = data;
              if (outboundEmail?.ticket_id) {
                console.log(`[Sync] Found ticket by thread_id: ${parsed.gmail_thread_id}`);
              }
            }
            
            // Método 2: Si no se encontró, buscar por in_reply_to (Message-ID del email original)
            if (!outboundEmail?.ticket_id && parsed.in_reply_to) {
              // Extraer message-id del header in-reply-to (formato: <message-id@domain>)
              const messageIdMatch = parsed.in_reply_to.match(/<([^>]+)>/);
              if (messageIdMatch) {
                const originalMessageId = messageIdMatch[1];
                console.log(`[Sync] Trying to link by in_reply_to: ${originalMessageId}`);
                
                const { data } = await supabase
                  .schema('crm')
                  .from('emails')
                  .select('ticket_id')
                  .or(`gmail_message_id.eq.${originalMessageId},thread_id.eq.${originalMessageId}`)
                  .eq('direction', 'outbound')
                  .eq('organization_id', organizationId)
                  .not('ticket_id', 'is', null)
                  .order('sent_at', { ascending: false })
                  .limit(1)
                  .single();
                
                outboundEmail = data;
                if (outboundEmail?.ticket_id) {
                  console.log(`[Sync] Found ticket by in_reply_to: ${originalMessageId}`);
                }
              }
            }
            
            // Método 3: Buscar por gmail_message_id si está disponible
            if (!outboundEmail?.ticket_id && parsed.gmail_message_id) {
              // Buscar emails enviados recientes del mismo thread
              const { data } = await supabase
                .schema('crm')
                .from('emails')
                .select('ticket_id, thread_id')
                .eq('thread_id', parsed.gmail_thread_id)
                .eq('direction', 'outbound')
                .eq('organization_id', organizationId)
                .not('ticket_id', 'is', null)
                .order('sent_at', { ascending: false })
                .limit(1)
                .single();
              
              outboundEmail = data;
              if (outboundEmail?.ticket_id) {
                console.log(`[Sync] Found ticket by thread_id (fallback): ${parsed.gmail_thread_id}`);
              }
            }
            
            // Vincular si se encontró un ticket
            if (outboundEmail?.ticket_id) {
              await supabase
                .schema('crm')
                .from('emails')
                .update({ ticket_id: outboundEmail.ticket_id })
                .eq('id', insertedEmail.id)
                .eq('organization_id', organizationId);
              
              console.log(`[Sync] ✅ Linked inbound email ${insertedEmail.id} to ticket ${outboundEmail.ticket_id}`);
            } else {
              console.log(`[Sync] ⚠️ Could not link inbound email ${insertedEmail.id} - thread_id: ${parsed.gmail_thread_id}, in_reply_to: ${parsed.in_reply_to}`);
            }
          }
          
          // Crear actividad si hay contacto
          if (contact?.id) {
            await supabase
              .schema('crm')
              .from('activities')
              .insert({
                organization_id: organizationId,
                contact_id: contact.id,
                type: 'email',
                subject: `Email ${isOutbound ? 'enviado' : 'recibido'}: ${parsed.subject}`,
                description: parsed.snippet,
                performed_at: parsed.date
              });
          }
        }

        // Actualizar o crear thread (isOutbound ya fue calculado arriba en línea 127)
        await upsertEmailThread(supabase, organizationId, parsed, contact?.id, isOutbound, accountId);
        result.updatedThreads++;

      } catch (msgError) {
        console.error(`Error processing message ${message.id}:`, msgError);
        result.errors.push(`Message ${message.id}: ${msgError instanceof Error ? msgError.message : 'Unknown error'}`);
      }
    }

    // Actualizar last_sync_at
    await supabase
      .schema('crm')
      .from('email_accounts')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_sync_error: result.errors.length > 0 ? result.errors.join('; ') : null
      })
      .eq('id', accountId);

    return result;
  } catch (error) {
    console.error(`[Sync Account ${accountId}] Error:`, error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    // Guardar error en BD
    await supabase
      .schema('crm')
      .from('email_accounts')
      .update({ last_sync_error: error instanceof Error ? error.message : 'Unknown error' })
      .eq('id', accountId);
    
    return result;
  }
}

/**
 * Obtiene y parsea un email de Gmail
 */
async function fetchAndParseEmail(
  gmail: any,
  messageId: string
): Promise<ParsedEmail | null> {
  try {
    const { data: message } = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    if (!message) return null;

    // Parsear headers
    const headers = message.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('from');
    const to = getHeader('to').split(',').map((e: string) => e.trim()).filter(Boolean);
    const cc = getHeader('cc').split(',').map((e: string) => e.trim()).filter(Boolean);
    const subject = getHeader('subject');
    const date = getHeader('date');
    const inReplyTo = getHeader('in-reply-to');
    const references = getHeader('references').split(/\s+/).filter(Boolean);

    // Extraer cuerpo
    let bodyHtml = '';
    let bodyText = '';

    const extractBody = (part: any): void => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    extractBody(message.payload);

    return {
      gmail_message_id: message.id!,
      gmail_thread_id: message.threadId!,
      from,
      to,
      cc,
      subject,
      body_html: bodyHtml || bodyText,
      body_text: bodyText,
      snippet: message.snippet || '',
      date: date || new Date().toISOString(),
      in_reply_to: inReplyTo,
      references,
      has_attachments: (message.payload?.parts || []).some((p: any) => p.filename),
      labels: message.labelIds || []
    };
  } catch (error) {
    console.error('Error fetching/parsing email:', error);
    return null;
  }
}

/**
 * Crea o actualiza un thread de email
 */
async function upsertEmailThread(
  supabase: SupabaseClient,
  organizationId: string,
  parsed: ParsedEmail,
  contactId?: string,
  isOutbound?: boolean,
  accountId?: string
): Promise<void> {
  try {
    const threadData: any = {
      organization_id: organizationId,
      gmail_thread_id: parsed.gmail_thread_id,
      subject: parsed.subject,
      snippet: parsed.snippet,
      participants: Array.from(new Set([parsed.from, ...parsed.to])),
      last_email_at: parsed.date,
      last_email_from: parsed.from,
      labels: parsed.labels,
      contact_id: contactId
    };

    // Establecer cuenta de origen del thread
    if (accountId) {
      if (isOutbound) {
        threadData.sent_from_account_id = accountId;
      } else {
        threadData.received_in_account_id = accountId;
      }
    }

    const { data: upsertedThread } = await supabase
      .schema('crm')
      .from('email_threads')
      .upsert(threadData, {
        onConflict: 'organization_id,gmail_thread_id'
      })
      .select('id')
      .single();

    // Auto-asignar a carpeta
    if (upsertedThread && isOutbound !== undefined) {
      const folderName = isOutbound ? 'Sent' : 'Inbox';
      
      const { data: folder } = await supabase
        .schema('crm')
        .from('folders')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', folderName)
        .single();

      if (folder) {
        // Verificar si ya existe antes de insertar
        const { data: existing } = await supabase
          .schema('crm')
          .from('thread_labels')
          .select('id')
          .eq('thread_id', upsertedThread.id)
          .eq('folder_id', folder.id)
          .single();

        if (!existing) {
          await supabase
            .schema('crm')
            .from('thread_labels')
            .insert({
              thread_id: upsertedThread.id,
              folder_id: folder.id
            });
        }
      }
    }
  } catch (error) {
    console.error('Error upserting thread:', error);
  }
}

/**
 * Sincroniza emails vía IMAP
 */
async function syncEmailsViaIMAP(
  supabase: SupabaseClient,
  accountId: string,
  organizationId: string,
  account: any,
  lastSyncAt?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    newEmails: 0,
    updatedThreads: 0,
    errors: []
  };

  try {
    // Desencriptar configuración IMAP
    const imapConfig: IMAPConfig = decryptObject(account.imap_config);
    
    const sinceDate = lastSyncAt ? new Date(lastSyncAt) : undefined;
    
    console.log(`[IMAP Sync] Fetching emails for ${account.email_address} since ${sinceDate || 'beginning'}`);
    
    // Obtener emails via IMAP
    const emails = await fetchEmailsIMAP(imapConfig, sinceDate, 100);
    
    console.log(`[IMAP Sync] Fetched ${emails.length} emails`);
    
    // Procesar cada email
    for (const parsed of emails) {
      try {
        // Verificar si ya existe
        const { data: existing } = await supabase
          .schema('crm')
          .from('emails')
          .select('id')
          .eq('gmail_message_id', parsed.messageId)
          .eq('organization_id', organizationId)
          .single();

        if (existing) continue;

        // Determinar dirección
        const accountEmail = account.email_address.toLowerCase();
        const isOutbound = parsed.from.toLowerCase().includes(accountEmail);

        // Intentar match con contacto
        const contactEmail = isOutbound ? parsed.to[0] : parsed.from;
        const { data: contact } = await supabase
          .schema('crm')
          .from('contacts')
          .select('id')
          .eq('organization_id', organizationId)
          .ilike('email', contactEmail)
          .single();

        // Insertar email
        const emailData: any = {
          organization_id: organizationId,
          contact_id: contact?.id || null,
          gmail_message_id: parsed.messageId,
          thread_id: parsed.messageId, // IMAP usa messageId como thread
          from_email: parsed.from,
          to_emails: parsed.to,
          cc_emails: parsed.cc,
          subject: parsed.subject,
          body_html: parsed.bodyHtml,
          body_text: parsed.bodyText,
          snippet: parsed.snippet,
          direction: isOutbound ? 'outbound' : 'inbound',
          status: 'delivered',
          sent_at: parsed.date.toISOString(),
          has_attachments: parsed.hasAttachments,
          in_reply_to: parsed.inReplyTo,
          "references": parsed.references
        };

        if (isOutbound) {
          emailData.sent_from_account_id = accountId;
        } else {
          emailData.received_in_account_id = accountId;
        }

        const { data: insertedEmail, error: insertError } = await supabase
          .schema('crm')
          .from('emails')
          .insert(emailData)
          .select('id')
          .single();

        if (insertError) {
          result.errors.push(`Failed to insert email: ${insertError.message}`);
        } else {
          result.newEmails++;
          
          // Si es email entrante, intentar vincularlo a un ticket por múltiples métodos
          if (!isOutbound && insertedEmail?.id) {
            let outboundEmail: any = null;
            
            // Método 1: Buscar por thread_id (para IMAP, thread_id es messageId)
            if (parsed.messageId) {
              const { data } = await supabase
                .schema('crm')
                .from('emails')
                .select('ticket_id')
                .eq('thread_id', parsed.messageId)
                .eq('direction', 'outbound')
                .eq('organization_id', organizationId)
                .not('ticket_id', 'is', null)
                .order('sent_at', { ascending: false })
                .limit(1)
                .single();
              
              outboundEmail = data;
              if (outboundEmail?.ticket_id) {
                console.log(`[IMAP Sync] Found ticket by thread_id: ${parsed.messageId}`);
              }
            }
            
            // Método 2: Si no se encontró, intentar por in_reply_to (Message-ID del email original)
            if (!outboundEmail?.ticket_id && parsed.inReplyTo) {
              // Extraer message-id del header in-reply-to
              const messageIdMatch = parsed.inReplyTo.match(/<([^>]+)>/);
              if (messageIdMatch) {
                const originalMessageId = messageIdMatch[1];
                console.log(`[IMAP Sync] Trying to link by in_reply_to: ${originalMessageId}`);
                
                const { data } = await supabase
                  .schema('crm')
                  .from('emails')
                  .select('ticket_id')
                  .or(`gmail_message_id.eq.${originalMessageId},thread_id.eq.${originalMessageId}`)
                  .eq('direction', 'outbound')
                  .eq('organization_id', organizationId)
                  .not('ticket_id', 'is', null)
                  .order('sent_at', { ascending: false })
                  .limit(1)
                  .single();
                
                outboundEmail = data;
                if (outboundEmail?.ticket_id) {
                  console.log(`[IMAP Sync] Found ticket by in_reply_to: ${originalMessageId}`);
                }
              } else {
                // Si no tiene formato <>, intentar directamente
                console.log(`[IMAP Sync] Trying to link by in_reply_to (direct): ${parsed.inReplyTo}`);
                const { data } = await supabase
                  .schema('crm')
                  .from('emails')
                  .select('ticket_id')
                  .or(`gmail_message_id.eq.${parsed.inReplyTo},thread_id.eq.${parsed.inReplyTo}`)
                  .eq('direction', 'outbound')
                  .eq('organization_id', organizationId)
                  .not('ticket_id', 'is', null)
                  .order('sent_at', { ascending: false })
                  .limit(1)
                  .single();
                
                outboundEmail = data;
              }
            }
            
            // Vincular si se encontró un ticket
            if (outboundEmail?.ticket_id) {
              await supabase
                .schema('crm')
                .from('emails')
                .update({ ticket_id: outboundEmail.ticket_id })
                .eq('id', insertedEmail.id)
                .eq('organization_id', organizationId);
              
              console.log(`[IMAP Sync] ✅ Linked inbound email ${insertedEmail.id} to ticket ${outboundEmail.ticket_id}`);
            } else {
              console.log(`[IMAP Sync] ⚠️ Could not link inbound email ${insertedEmail.id} - thread_id: ${parsed.messageId}, in_reply_to: ${parsed.inReplyTo}`);
            }
          }
          
          // Crear actividad si hay contacto
          if (contact?.id) {
            await supabase
              .schema('crm')
              .from('activities')
              .insert({
                organization_id: organizationId,
                contact_id: contact.id,
                type: 'email',
                subject: `Email ${isOutbound ? 'enviado' : 'recibido'}: ${parsed.subject}`,
                description: parsed.snippet,
                performed_at: parsed.date.toISOString()
              });
          }
        }

        // Crear/actualizar thread (usar messageId como thread_id)
        const threadData: any = {
          organization_id: organizationId,
          gmail_thread_id: parsed.messageId,
          subject: parsed.subject,
          snippet: parsed.snippet,
          participants: Array.from(new Set([parsed.from, ...parsed.to])),
          last_email_at: parsed.date.toISOString(),
          last_email_from: parsed.from,
          contact_id: contact?.id,
          labels: []
        };

        // Establecer cuenta de origen del thread
        if (isOutbound) {
          threadData.sent_from_account_id = accountId;
        } else {
          threadData.received_in_account_id = accountId;
        }

        const { data: upsertedThread } = await supabase
          .schema('crm')
          .from('email_threads')
          .upsert(threadData, {
            onConflict: 'organization_id,gmail_thread_id'
          })
          .select('id')
          .single();
        
        // Auto-asignar a carpeta (Inbox para recibidos, Sent para enviados)
        if (upsertedThread) {
          const folderName = isOutbound ? 'Sent' : 'Inbox';
          
          const { data: folder } = await supabase
            .schema('crm')
            .from('folders')
            .select('id')
            .eq('organization_id', organizationId)
            .eq('name', folderName)
            .single();

          if (folder) {
            // Verificar si ya existe antes de insertar
            const { data: existing } = await supabase
              .schema('crm')
              .from('thread_labels')
              .select('id')
              .eq('thread_id', upsertedThread.id)
              .eq('folder_id', folder.id)
              .single();

            if (!existing) {
              await supabase
                .schema('crm')
                .from('thread_labels')
                .insert({
                  thread_id: upsertedThread.id,
                  folder_id: folder.id
                });
            }
          }
        }
        
        result.updatedThreads++;

      } catch (error) {
        console.error('[IMAP Sync] Error processing email:', error);
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Actualizar last_sync_at
    await supabase
      .schema('crm')
      .from('email_accounts')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_sync_error: result.errors.length > 0 ? result.errors.join('; ') : null
      })
      .eq('id', accountId);

    return result;
  } catch (error) {
    console.error(`[IMAP Sync Account ${accountId}] Error:`, error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    
    await supabase
      .schema('crm')
      .from('email_accounts')
      .update({ last_sync_error: error instanceof Error ? error.message : 'Unknown error' })
      .eq('id', accountId);
    
    return result;
  }
}

