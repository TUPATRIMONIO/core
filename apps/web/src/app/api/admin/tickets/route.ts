import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Listar tickets
 * 
 * GET /api/admin/tickets?status=new&priority=high&assigned_to=xxx
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
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Solo los platform admins pueden acceder a tickets' },
        { status: 403 }
      )
    }

    // Obtener organización platform
    const { data: platformOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('org_type', 'platform')
      .eq('status', 'active')
      .single()

    if (!platformOrg) {
      return NextResponse.json(
        { error: 'No se encontró la organización platform' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assigned_to')
    const contactId = searchParams.get('contact_id')
    const orderId = searchParams.get('order_id')
    const unreadOnly = searchParams.get('unread_only') === 'true'
    
    // Filtros avanzados de email
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const fromEmail = searchParams.get('from_email')
    const toEmail = searchParams.get('to_email')
    const subject = searchParams.get('subject')
    const bodyText = searchParams.get('body_text')

    // Primero obtener todos los tickets
    let query = serviceSupabase
      .from('tickets')
      .select(`
        *,
        contact:contacts(id, email, first_name, last_name, full_name),
        assigned_user:users!tickets_assigned_to_fkey(id, first_name, last_name),
        order:orders(id, order_number, status, amount, currency)
      `)
      .eq('organization_id', platformOrg.id)
      .order('updated_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority)
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    if (orderId) {
      query = query.eq('order_id', orderId)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error('Error obteniendo tickets:', error)
      return NextResponse.json(
        { error: 'Error al obtener tickets: ' + error.message },
        { status: 500 }
      )
    }

    let filteredTickets = tickets || []

    // Aplicar filtros de email si existen
    const hasEmailFilters = dateFrom || dateTo || fromEmail || toEmail || subject || bodyText || unreadOnly
    
    if (hasEmailFilters) {
      // Si solo se busca por subject, también buscar en el subject del ticket directamente
      if (subject && !dateFrom && !dateTo && !fromEmail && !toEmail && !bodyText && !unreadOnly) {
        // Buscar en subject del ticket directamente
        filteredTickets = filteredTickets.filter((t: any) => 
          t.subject?.toLowerCase().includes(subject.toLowerCase())
        )
      } else {
        // Para otros filtros, buscar en emails
        const ticketIds = filteredTickets.map((t: any) => t.id)
        
        if (ticketIds.length === 0) {
          return NextResponse.json({
            tickets: [],
            count: 0,
          })
        }

        // Construir query de emails con filtros
        let emailQuery = serviceSupabase
          .from('emails')
          .select('ticket_id')
          .in('ticket_id', ticketIds)
          .eq('organization_id', platformOrg.id)

        if (dateFrom) {
          emailQuery = emailQuery.gte('sent_at', dateFrom)
        }
        if (dateTo) {
          // Agregar un día completo para incluir el día hasta
          const dateToEnd = new Date(dateTo)
          dateToEnd.setHours(23, 59, 59, 999)
          emailQuery = emailQuery.lte('sent_at', dateToEnd.toISOString())
        }
        if (fromEmail) {
          emailQuery = emailQuery.ilike('from_email', `%${fromEmail}%`)
        }
        if (toEmail) {
          // Buscar en el array to_emails usando contains
          emailQuery = emailQuery.contains('to_emails', [toEmail])
        }
        if (subject) {
          emailQuery = emailQuery.ilike('subject', `%${subject}%`)
        }
        if (bodyText) {
          // Buscar en body_text o body_html usando OR
          emailQuery = emailQuery.or(`body_text.ilike.%${bodyText}%,body_html.ilike.%${bodyText}%`)
        }
        if (unreadOnly) {
          emailQuery = emailQuery.eq('is_read', false).eq('direction', 'inbound')
        }

        const { data: filteredEmails, error: emailError } = await emailQuery

        if (emailError) {
          console.error('Error filtrando emails:', emailError)
          return NextResponse.json(
            { error: 'Error al filtrar emails: ' + emailError.message },
            { status: 500 }
          )
        }

        // Obtener IDs únicos de tickets que coinciden con los filtros
        const matchingTicketIds = new Set(filteredEmails?.map((e: any) => e.ticket_id) || [])
        
        // Si también hay filtro de subject, incluir tickets que coincidan por subject directamente
        if (subject) {
          const ticketsBySubject = filteredTickets
            .filter((t: any) => t.subject?.toLowerCase().includes(subject.toLowerCase()))
            .map((t: any) => t.id)
          
          ticketsBySubject.forEach((id: string) => matchingTicketIds.add(id))
        }
        
        filteredTickets = filteredTickets.filter((t: any) => matchingTicketIds.has(t.id))
      }
    }

    return NextResponse.json({
      tickets: filteredTickets,
      count: filteredTickets.length,
    })
  } catch (error: any) {
    console.error('Error en GET /api/admin/tickets:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener tickets' },
      { status: 500 }
    )
  }
}
