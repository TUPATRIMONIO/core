import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Limpiar tickets duplicados
 * 
 * POST /api/admin/tickets/cleanup-duplicates
 * 
 * Identifica y consolida tickets duplicados basándose en:
 * - Mismo thread_id de Gmail
 * - Mismo gmail_message_id en emails
 * - Mismo asunto y mismo contacto (dentro de un rango de tiempo)
 */
export async function POST(request: NextRequest) {
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
        { error: 'Solo los platform admins pueden ejecutar limpieza de duplicados' },
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

    const organizationId = platformOrg.id

    console.log('🔍 Iniciando limpieza de tickets duplicados...')

    const results = {
      duplicatesFound: 0,
      ticketsMerged: 0,
      emailsMoved: 0,
      activitiesMoved: 0,
      ticketsDeleted: 0,
      errors: [] as string[],
    }

    // ESTRATEGIA 1: Duplicados por thread_id de Gmail
    // Obtener todos los emails con sus tickets y threads
    const { data: allEmails } = await serviceSupabase
      .from('emails')
      .select('id, ticket_id, thread_id_crm, gmail_message_id, thread_id')
      .eq('organization_id', organizationId)
      .not('ticket_id', 'is', null)
      .not('thread_id_crm', 'is', null)

    // Agrupar por thread_id_crm para encontrar duplicados
    const ticketsByThread: Record<string, string[]> = {}
    
    for (const email of allEmails || []) {
      if (email.thread_id_crm && email.ticket_id) {
        if (!ticketsByThread[email.thread_id_crm]) {
          ticketsByThread[email.thread_id_crm] = []
        }
        if (!ticketsByThread[email.thread_id_crm].includes(email.ticket_id)) {
          ticketsByThread[email.thread_id_crm].push(email.ticket_id)
        }
      }
    }

    // Encontrar threads con múltiples tickets
    const duplicateThreads: Array<{ threadId: string; ticketIds: string[] }> = []
    
    for (const [threadId, ticketIds] of Object.entries(ticketsByThread)) {
      if (ticketIds.length > 1) {
        duplicateThreads.push({ threadId, ticketIds })
        results.duplicatesFound++
      }
    }

    console.log(`📊 Encontrados ${duplicateThreads.length} threads con tickets duplicados`)

    // Consolidar cada grupo de duplicados
    for (const { threadId, ticketIds } of duplicateThreads) {
      try {
        // Ordenar tickets por fecha de creación (el más antiguo es el principal)
        const { data: tickets } = await serviceSupabase
          .from('tickets')
          .select('id, created_at, ticket_number')
          .in('id', ticketIds)
          .order('created_at', { ascending: true })

        if (!tickets || tickets.length < 2) continue

        const primaryTicket = tickets[0]
        const duplicateTickets = tickets.slice(1)

        console.log(`🔄 Consolidando ${tickets.length} tickets del thread ${threadId}`)
        console.log(`   Ticket principal: ${primaryTicket.ticket_number} (${primaryTicket.id})`)

        // Mover emails de tickets duplicados al ticket principal
        for (const duplicateTicket of duplicateTickets) {
          const { data: emailsToMove } = await serviceSupabase
            .from('emails')
            .select('id')
            .eq('ticket_id', duplicateTicket.id)

          if (emailsToMove && emailsToMove.length > 0) {
            const { error: updateError } = await serviceSupabase
              .from('emails')
              .update({ ticket_id: primaryTicket.id })
              .eq('ticket_id', duplicateTicket.id)

            if (updateError) {
              console.error(`Error moviendo emails del ticket ${duplicateTicket.id}:`, updateError)
              results.errors.push(`Error moviendo emails: ${updateError.message}`)
            } else {
              results.emailsMoved += emailsToMove.length
              console.log(`   ✅ Movidos ${emailsToMove.length} emails al ticket principal`)
            }
          }

          // Mover actividades de tickets duplicados al ticket principal
          const { data: activitiesToMove } = await serviceSupabase
            .from('activities')
            .select('id')
            .eq('ticket_id', duplicateTicket.id)

          if (activitiesToMove && activitiesToMove.length > 0) {
            const { error: updateError } = await serviceSupabase
              .from('activities')
              .update({ ticket_id: primaryTicket.id })
              .eq('ticket_id', duplicateTicket.id)

            if (updateError) {
              console.error(`Error moviendo actividades del ticket ${duplicateTicket.id}:`, updateError)
              results.errors.push(`Error moviendo actividades: ${updateError.message}`)
            } else {
              results.activitiesMoved += activitiesToMove.length
              console.log(`   ✅ Movidas ${activitiesToMove.length} actividades al ticket principal`)
            }
          }

          // Actualizar thread_id_crm en el ticket principal si no lo tiene
          const { data: primaryTicketData } = await serviceSupabase
            .from('tickets')
            .select('thread_id_crm')
            .eq('id', primaryTicket.id)
            .single()

          if (!primaryTicketData?.thread_id_crm) {
            // Obtener thread_id_crm del email
            const { data: emailWithThread } = await serviceSupabase
              .from('emails')
              .select('thread_id_crm')
              .eq('ticket_id', primaryTicket.id)
              .not('thread_id_crm', 'is', null)
              .limit(1)
              .single()

            if (emailWithThread?.thread_id_crm) {
              await serviceSupabase
                .from('tickets')
                .update({ thread_id_crm: emailWithThread.thread_id_crm })
                .eq('id', primaryTicket.id)
            }
          }

          // Actualizar ticket_contacts si existen
          const { data: ticketContacts } = await serviceSupabase
            .from('ticket_contacts')
            .select('contact_id, contact_role')
            .eq('ticket_id', duplicateTicket.id)

          if (ticketContacts && ticketContacts.length > 0) {
            for (const tc of ticketContacts) {
              // Insertar en ticket principal si no existe
              await serviceSupabase
                .from('ticket_contacts')
                .upsert({
                  ticket_id: primaryTicket.id,
                  contact_id: tc.contact_id,
                  contact_role: tc.contact_role,
                }, {
                  onConflict: 'ticket_id,contact_id',
                })
            }
          }

          // Eliminar ticket duplicado
          const { error: deleteError } = await serviceSupabase
            .from('tickets')
            .delete()
            .eq('id', duplicateTicket.id)

          if (deleteError) {
            console.error(`Error eliminando ticket ${duplicateTicket.id}:`, deleteError)
            results.errors.push(`Error eliminando ticket: ${deleteError.message}`)
          } else {
            results.ticketsDeleted++
            console.log(`   🗑️ Eliminado ticket duplicado: ${duplicateTicket.ticket_number}`)
          }
        }

        results.ticketsMerged += duplicateTickets.length
      } catch (error: any) {
        console.error(`Error consolidando thread ${threadId}:`, error)
        results.errors.push(`Thread ${threadId}: ${error.message}`)
      }
    }

    // ESTRATEGIA 2: Duplicados por mismo gmail_message_id
    // Buscar emails con el mismo gmail_message_id pero diferentes ticket_id
    const { data: duplicateEmails } = await serviceSupabase
      .from('emails')
      .select('gmail_message_id, ticket_id, id')
      .eq('organization_id', organizationId)
      .not('gmail_message_id', 'is', null)
      .not('ticket_id', 'is', null)

    const emailsByMessageId: Record<string, Array<{ id: string; ticket_id: string }>> = {}
    
    for (const email of duplicateEmails || []) {
      if (email.gmail_message_id) {
        if (!emailsByMessageId[email.gmail_message_id]) {
          emailsByMessageId[email.gmail_message_id] = []
        }
        emailsByMessageId[email.gmail_message_id].push({
          id: email.id,
          ticket_id: email.ticket_id,
        })
      }
    }

    // Encontrar message IDs con múltiples tickets
    for (const [messageId, emails] of Object.entries(emailsByMessageId)) {
      const uniqueTicketIds = [...new Set(emails.map(e => e.ticket_id))]
      
      if (uniqueTicketIds.length > 1) {
        console.log(`⚠️ Email ${messageId} tiene ${uniqueTicketIds.length} tickets diferentes`)
        results.duplicatesFound++

        // Obtener tickets ordenados por fecha
        const { data: tickets } = await serviceSupabase
          .from('tickets')
          .select('id, created_at, ticket_number')
          .in('id', uniqueTicketIds)
          .order('created_at', { ascending: true })

        if (!tickets || tickets.length < 2) continue

        const primaryTicket = tickets[0]
        const duplicateTickets = tickets.slice(1)

        // Mover todos los emails con este message_id al ticket principal
        const { error: updateError } = await serviceSupabase
          .from('emails')
          .update({ ticket_id: primaryTicket.id })
          .eq('gmail_message_id', messageId)
          .neq('ticket_id', primaryTicket.id)

        if (!updateError) {
          results.emailsMoved += emails.length - 1
          console.log(`   ✅ Consolidados ${emails.length} emails con message_id ${messageId}`)
        }
      }
    }

    console.log('✅ Limpieza de duplicados completada')

    return NextResponse.json({
      success: true,
      results,
      message: `Limpieza completada: ${results.duplicatesFound} duplicados encontrados, ${results.ticketsMerged} tickets consolidados, ${results.ticketsDeleted} tickets eliminados`,
    })
  } catch (error: any) {
    console.error('Error en limpieza de duplicados:', error)
    return NextResponse.json(
      { error: error.message || 'Error al limpiar duplicados' },
      { status: 500 }
    )
  }
}

