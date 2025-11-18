/**
 * API Route: /api/crm/tickets/[id]/emails
 * Obtener historial de emails de un ticket
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar que el ticket pertenece a la organización
    const { data: ticket } = await supabase
      .schema('crm')
      .from('tickets')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!ticket || ticket.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Obtener emails del ticket
    // Primero obtener los thread_ids y gmail_message_ids de los emails que ya están vinculados al ticket
    const { data: ticketEmails } = await supabase
      .schema('crm')
      .from('emails')
      .select('thread_id, gmail_message_id, id')
      .eq('ticket_id', id);
    
    // Extraer thread_ids y message_ids únicos
    const threadIds = ticketEmails
      ? Array.from(new Set(ticketEmails.map((e: any) => e.thread_id).filter(Boolean)))
      : [];
    
    const messageIds = ticketEmails
      ? Array.from(new Set(ticketEmails.map((e: any) => e.gmail_message_id).filter(Boolean)))
      : [];
    
    // Obtener emails del ticket: directamente vinculados O que compartan thread_id/message_id
    let emails: any[] = [];
    let queryError: any = null;
    
    // Primero obtener emails directamente vinculados
    const { data: directEmails, error: directError } = await supabase
      .schema('crm')
      .from('emails')
      .select(`
        id,
        subject,
        from_email,
        to_emails,
        body_html,
        body_text,
        direction,
        sent_at,
        is_read,
        contact_id,
        thread_id,
        gmail_message_id,
        ticket_id,
        in_reply_to
      `)
      .eq('ticket_id', id)
      .order('sent_at', { ascending: false });
    
    if (directError) {
      queryError = directError;
    } else {
      emails = directEmails || [];
    }
    
    // Si hay thread_ids, buscar emails que compartan esos thread_ids pero no estén vinculados a este ticket
    if (threadIds.length > 0 && !queryError) {
      const { data: threadEmails, error: threadError } = await supabase
        .schema('crm')
        .from('emails')
        .select(`
          id,
          subject,
          from_email,
          to_emails,
          body_html,
          body_text,
          direction,
          sent_at,
          is_read,
          contact_id,
          thread_id,
          gmail_message_id,
          ticket_id,
          in_reply_to
        `)
        .in('thread_id', threadIds)
        .or(`ticket_id.is.null,ticket_id.neq.${id}`) // Emails sin ticket_id o con ticket_id diferente
        .order('sent_at', { ascending: false });
      
      if (!threadError && threadEmails) {
        // Combinar ambos resultados, evitando duplicados
        const existingIds = new Set(emails.map((e: any) => e.id));
        const newEmails = threadEmails.filter((e: any) => !existingIds.has(e.id));
        emails = [...emails, ...newEmails];
      }
    }
    
    // También buscar emails entrantes que tengan in_reply_to apuntando a nuestros message_ids
    if (messageIds.length > 0 && !queryError) {
      const allReplyEmails: any[] = [];
      
      for (const msgId of messageIds) {
        // Buscar emails que tengan este message_id en su in_reply_to
        const { data: replyEmails } = await supabase
          .schema('crm')
          .from('emails')
          .select(`
            id,
            subject,
            from_email,
            to_emails,
            body_html,
            body_text,
            direction,
            sent_at,
            is_read,
            contact_id,
            thread_id,
            gmail_message_id,
            ticket_id,
            in_reply_to
          `)
          .or(`ticket_id.is.null,ticket_id.neq.${id}`)
          .not('in_reply_to', 'is', null)
          .ilike('in_reply_to', `%${msgId}%`)
          .order('sent_at', { ascending: false });
        
        if (replyEmails) {
          // Filtrar los que realmente coinciden (verificar que el message ID esté en in_reply_to)
          const matchingReplies = replyEmails.filter((email: any) => {
            if (!email.in_reply_to) return false;
            // Extraer message IDs del header in-reply-to
            const messageIdMatches = email.in_reply_to.match(/<([^>]+)>/g) || [];
            const extractedIds = messageIdMatches.map((m: string) => m.replace(/[<>]/g, ''));
            return email.in_reply_to.includes(msgId) || extractedIds.includes(msgId);
          });
          
          allReplyEmails.push(...matchingReplies);
        }
      }
      
      // Eliminar duplicados y agregar a la lista
      const uniqueReplyEmails = Array.from(
        new Map(allReplyEmails.map((e: any) => [e.id, e])).values()
      );
      
      if (uniqueReplyEmails.length > 0) {
        const existingIds = new Set(emails.map((e: any) => e.id));
        const newEmails = uniqueReplyEmails.filter((e: any) => !existingIds.has(e.id));
        emails = [...emails, ...newEmails];
        console.log(`[GET /api/crm/tickets/${id}/emails] Found ${uniqueReplyEmails.length} emails by in_reply_to`);
      }
    }
    
    // Ordenar por fecha (más reciente primero)
    emails.sort((a: any, b: any) => {
      const dateA = new Date(a.sent_at).getTime();
      const dateB = new Date(b.sent_at).getTime();
      return dateB - dateA;
    });
    
    const filteredEmails = emails;

    // Si hay emails, obtener nombres de contactos por separado
    let contactNames: Record<string, string> = {};
    if (filteredEmails && filteredEmails.length > 0) {
      const contactIds = filteredEmails
        .map((e: any) => e.contact_id)
        .filter((id: string) => id !== null);
      
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .schema('crm')
          .from('contacts')
          .select('id, full_name')
          .in('id', contactIds);
        
        if (contacts) {
          contacts.forEach((c: any) => {
            contactNames[c.id] = c.full_name;
          });
        }
      }
    }

    if (queryError) {
      // Si la tabla no tiene ticket_id o hay error, intentar con función SQL como fallback
      if (queryError.code === '42703' || queryError.message.includes('does not exist')) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_ticket_emails', {
          p_ticket_id: id
        });

        if (rpcError) {
          console.error('Error fetching ticket emails (both methods failed):', rpcError);
          return NextResponse.json({ 
            error: 'No se pudieron obtener los emails del ticket',
            details: rpcError.message 
          }, { status: 500 });
        }

        return NextResponse.json(rpcData || []);
      }

      console.error('Error fetching ticket emails:', queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Transformar datos al formato esperado
    const formattedEmails = filteredEmails.map((email: any) => ({
      email_id: email.id,
      subject: email.subject,
      from_email: email.from_email,
      to_emails: email.to_emails || [],
      body_html: email.body_html,
      body_text: email.body_text,
      direction: email.direction,
      sent_at: email.sent_at,
      is_read: email.is_read || false,
      contact_name: email.contact_id ? (contactNames[email.contact_id] || null) : null,
      thread_id: email.thread_id || email.gmail_message_id || email.id, // Usar thread_id o message_id como fallback
      message_id: email.gmail_message_id || email.id
    }));

    console.log(`[GET /api/crm/tickets/${id}/emails] Found ${formattedEmails.length} emails (${threadIds.length} thread_ids, ${messageIds.length} message_ids)`);
    
    // Si hay emails sin ticket_id pero con thread_id compartido o in_reply_to, intentar vincularlos
    const emailsToLink = filteredEmails.filter((e: any) => {
      if (e.ticket_id) return false; // Ya está vinculado
      
      // Vincular si comparte thread_id
      if (e.thread_id && threadIds.includes(e.thread_id)) return true;
      
      // Vincular si tiene in_reply_to que apunta a uno de nuestros message_ids
      if (e.in_reply_to && messageIds.length > 0) {
        const messageIdMatches = e.in_reply_to.match(/<([^>]+)>/g) || [];
        const extractedIds = messageIdMatches.map((m: string) => m.replace(/[<>]/g, ''));
        return messageIds.some(msgId => 
          e.in_reply_to.includes(msgId) || extractedIds.includes(msgId)
        );
      }
      
      return false;
    });
    
    if (emailsToLink.length > 0) {
      console.log(`[GET /api/crm/tickets/${id}/emails] 🔗 Linking ${emailsToLink.length} emails by thread_id/in_reply_to`);
      // Vincular estos emails al ticket
      for (const email of emailsToLink) {
        const { error: linkError } = await supabase
          .schema('crm')
          .from('emails')
          .update({ ticket_id: id })
          .eq('id', email.id);
        
        if (linkError) {
          console.error(`[GET /api/crm/tickets/${id}/emails] Error linking email ${email.id}:`, linkError);
        } else {
          console.log(`[GET /api/crm/tickets/${id}/emails] ✅ Linked email ${email.id} to ticket`);
        }
      }
    }

    return NextResponse.json(formattedEmails);
  } catch (error) {
    console.error('Error in GET /api/crm/tickets/[id]/emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
