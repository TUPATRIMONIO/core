import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route de diagnóstico: Verificar threading de emails
 * GET /api/admin/debug/thread-check?ticket_id=xxx
 * 
 * TEMPORAL - Eliminar después de resolver el problema
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Solo platform admins' }, { status: 403 })
    }

    const ticketId = request.nextUrl.searchParams.get('ticket_id')
    
    // Obtener organización platform
    const { data: platformOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_type', 'platform')
      .eq('status', 'active')
      .single()

    if (!platformOrg) {
      return NextResponse.json({ error: 'No org platform' }, { status: 404 })
    }

    // Si se especifica ticket_id, verificar ese ticket
    if (ticketId) {
      // Obtener ticket
      const { data: ticket, error: ticketError } = await serviceSupabase
        .from('tickets')
        .select('id, ticket_number, subject, contact_id')
        .eq('id', ticketId)
        .single()

      if (ticketError || !ticket) {
        return NextResponse.json({ error: 'Ticket no encontrado', ticketError }, { status: 404 })
      }

      // Obtener emails del ticket
      const { data: emails, error: emailsError } = await serviceSupabase
        .from('emails')
        .select('id, gmail_message_id, thread_id, direction, subject, from_email, ticket_id, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      // Buscar otros emails con el mismo thread_id
      const threadIds = [...new Set((emails || []).map(e => e.thread_id).filter(Boolean))]
      
      let emailsInSameThreads: any[] = []
      if (threadIds.length > 0) {
        const { data: otherEmails } = await serviceSupabase
          .from('emails')
          .select('id, gmail_message_id, thread_id, direction, subject, from_email, ticket_id, created_at')
          .eq('organization_id', platformOrg.id)
          .in('thread_id', threadIds)
          .neq('ticket_id', ticketId)
          .order('created_at', { ascending: true })
        
        emailsInSameThreads = otherEmails || []
      }

      // Buscar tickets con subjects similares
      const cleanSubject = ticket.subject.replace(/^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*/gi, '').trim()
      
      const { data: similarTickets } = await serviceSupabase
        .from('tickets')
        .select('id, ticket_number, subject, created_at')
        .eq('organization_id', platformOrg.id)
        .eq('contact_id', ticket.contact_id)
        .neq('id', ticketId)
        .ilike('subject', `%${cleanSubject}%`)
        .limit(10)

      return NextResponse.json({
        ticket,
        cleanSubject,
        emails: emails || [],
        threadIds,
        emailsInSameThreads,
        similarTickets: similarTickets || [],
        message: `Ticket tiene ${emails?.length || 0} emails. Thread IDs: ${threadIds.join(', ') || 'ninguno'}`
      })
    }

    // Sin ticket_id, mostrar resumen de tickets recientes con "Re:" en subject
    const { data: recentTickets, error: ticketsError } = await serviceSupabase
      .from('tickets')
      .select('id, ticket_number, subject, created_at, contact_id')
      .eq('organization_id', platformOrg.id)
      .ilike('subject', 'Re:%')
      .order('created_at', { ascending: false })
      .limit(20)

    // Para cada ticket, verificar si hay otros tickets con subject similar
    const ticketsWithDuplicates = []
    for (const t of recentTickets || []) {
      const cleanSubject = t.subject.replace(/^(Re:|Fwd:|RE:|FW:|re:|fwd:)\s*/gi, '').trim()
      
      const { data: similar } = await serviceSupabase
        .from('tickets')
        .select('id, ticket_number, subject')
        .eq('organization_id', platformOrg.id)
        .eq('contact_id', t.contact_id)
        .neq('id', t.id)
        .or(`subject.ilike.%${cleanSubject}%,subject.eq.${cleanSubject}`)
        .limit(5)

      if (similar && similar.length > 0) {
        ticketsWithDuplicates.push({
          ticket: t,
          cleanSubject,
          possibleDuplicates: similar
        })
      }
    }

    // Verificar función RPC
    const { data: rpcTest, error: rpcError } = await serviceSupabase.rpc('get_ticket_for_gmail_thread', {
      p_organization_id: platformOrg.id,
      p_gmail_thread_id: 'test-thread-id-that-does-not-exist'
    })

    return NextResponse.json({
      rpcStatus: rpcError ? `ERROR: ${rpcError.message}` : 'OK (función existe)',
      recentTicketsWithRe: recentTickets?.length || 0,
      ticketsWithPossibleDuplicates: ticketsWithDuplicates,
      hint: 'Usa ?ticket_id=xxx para ver detalles de un ticket específico'
    })
  } catch (error: any) {
    console.error('Error en debug/thread-check:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

