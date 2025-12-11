import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendEmailWithSharedAccount } from '@/lib/gmail/client'

/**
 * API Route: Responder a un ticket (CRM)
 * 
 * POST /api/crm/tickets/[id]/reply
 * Body: { to, subject, body_html, body_text?, include_signature? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener organización activa del usuario
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();
    
    if (!orgUser) {
        return NextResponse.json(
            { error: "Usuario no pertenece a ninguna organización activa" },
            { status: 403 }
        );
    }
    const organizationId = orgUser.organization_id;

    // Obtener ticket y verificar que pertenece a la organización
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from('tickets')
      .select('*, contact:contacts(*)')
      .eq('id', id)
      .eq('organization_id', organizationId) // Verificar propiedad
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { to, subject, body_html, body_text, include_signature = true } = body

    if (!to || !subject || !body_html) {
      return NextResponse.json(
        { error: 'to, subject y body_html son requeridos' },
        { status: 400 }
      )
    }

    // Obtener el último email inbound del ticket para obtener el threadId de Gmail
    const { data: lastInboundEmail } = await serviceSupabase
      .from('emails')
      .select('thread_id, gmail_message_id, message_id, in_reply_to, references')
      .eq('ticket_id', id)
      .eq('direction', 'inbound')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single()

    // Construir headers de threading para mejor compatibilidad
    let inReplyTo: string | undefined
    let references: string[] | undefined
    let gmailThreadId: string | undefined

    if (lastInboundEmail) {
      // Usar el threadId de Gmail si existe (más confiable para threading)
      if (lastInboundEmail.thread_id) {
        gmailThreadId = lastInboundEmail.thread_id
      }

      // Construir headers In-Reply-To y References usando el Message-ID del header
      // El Message-ID del último email inbound debe ser el In-Reply-To del nuevo email
      if (lastInboundEmail.message_id) {
        // Usar el Message-ID del header del último email como In-Reply-To
        inReplyTo = lastInboundEmail.message_id
        
        // Construir References: incluir todas las referencias anteriores + el Message-ID del último email
        const previousReferences = lastInboundEmail.references && Array.isArray(lastInboundEmail.references) 
          ? lastInboundEmail.references 
          : []
        
        // Si el último email tenía un In-Reply-To, incluirlo en References también
        if (lastInboundEmail.in_reply_to && !previousReferences.includes(lastInboundEmail.in_reply_to)) {
          previousReferences.push(lastInboundEmail.in_reply_to)
        }
        
        // Agregar el Message-ID del último email a References si no está ya incluido
        if (!previousReferences.includes(lastInboundEmail.message_id)) {
          previousReferences.push(lastInboundEmail.message_id)
        }
        
        references = previousReferences
      } else {
        // Fallback: usar in_reply_to si message_id no está disponible (emails antiguos)
        if (lastInboundEmail.in_reply_to) {
          inReplyTo = lastInboundEmail.in_reply_to
        }
        
        if (lastInboundEmail.references && Array.isArray(lastInboundEmail.references)) {
          references = lastInboundEmail.references
        }
      }
    }

    // Enviar email usando cuenta compartida con threading
    // Gmail agrupará automáticamente si pasamos el threadId
    const { messageId, threadId } = await sendEmailWithSharedAccount(
      organizationId,
      user.id,
      to,
      subject,
      body_html,
      body_text,
      include_signature,
      inReplyTo,
      references,
      gmailThreadId
    )

    // Obtener thread_id_crm si existe
    let threadIdCrm: string | null = null
    if (threadId) {
      const { data: emailThread } = await serviceSupabase
        .from('email_threads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('gmail_thread_id', threadId)
        .single()

      if (emailThread) {
        threadIdCrm = emailThread.id
      } else {
        // Crear nuevo thread si no existe
        const { data: newThread } = await serviceSupabase
          .from('email_threads')
          .insert({
            organization_id: organizationId,
            gmail_thread_id: threadId,
            contact_id: ticket.contact_id,
            subject: subject,
            snippet: body_text || body_html.replace(/<[^>]*>/g, '').substring(0, 100),
            participants: [to],
            last_email_at: new Date().toISOString(),
            last_email_from: to,
            email_count: 1,
          })
          .select('id')
          .single()

        if (newThread) {
          threadIdCrm = newThread.id
        }
      }
    }

    // Obtener cuenta Gmail compartida para sent_from_account_id
    const { data: gmailAccount } = await serviceSupabase
      .from('email_accounts')
      .select('id, email_address')
      .eq('organization_id', organizationId)
      .eq('account_type', 'shared')
      .eq('is_active', true)
      .single()

    // Guardar email en BD
    console.log(`📧 Guardando email outbound - threadId: ${threadId}, ticketId: ${id}, messageId: ${messageId}`)
    const { data: savedEmail, error: emailError } = await serviceSupabase
      .from('emails')
      .insert({
        organization_id: organizationId,
        contact_id: ticket.contact_id,
        ticket_id: id,
        thread_id_crm: threadIdCrm,
        gmail_message_id: messageId,
        thread_id: threadId,
        from_email: gmailAccount?.email_address || 'contacto@tupatrimonio.app',
        to_emails: [to],
        subject: subject,
        body_html: body_html,
        body_text: body_text || body_html.replace(/<[^>]*>/g, ''),
        direction: 'outbound',
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        sent_from_account_id: gmailAccount?.id || null,
        is_read: true,
        snippet: body_text || body_html.replace(/<[^>]*>/g, '').substring(0, 100),
      })
      .select()
      .single()

    if (emailError) {
      console.error('Error guardando email:', emailError)
      // No fallar, el email ya fue enviado
    }

    // Actualizar ticket
    await serviceSupabase
      .from('tickets')
      .update({
        updated_at: new Date().toISOString(),
        first_response_at: ticket.first_response_at || new Date().toISOString(),
      })
      .eq('id', id)

    // Crear actividad
    await serviceSupabase
      .from('activities')
      .insert({
        organization_id: organizationId,
        contact_id: ticket.contact_id,
        ticket_id: id,
        type: 'email',
        subject: `Email enviado: ${subject}`,
        description: body_text || body_html.replace(/<[^>]*>/g, '').substring(0, 500),
        performed_by: user.id,
      })

    return NextResponse.json({
      success: true,
      message: 'Email enviado exitosamente',
      email: savedEmail,
      messageId,
      threadId,
    })
  } catch (error: any) {
    console.error('Error en POST /api/crm/tickets/[id]/reply:', error)
    return NextResponse.json(
      { error: error.message || 'Error al enviar respuesta' },
      { status: 500 }
    )
  }
}
