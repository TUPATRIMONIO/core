import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Consolidar tickets duplicados por thread_id
 * POST /api/admin/tickets/consolidate
 * Body: { keepTicketId: string, mergeTicketIds: string[] }
 * 
 * Mueve todos los emails de mergeTicketIds al keepTicketId y elimina los tickets vacíos
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
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: 'Solo platform admins' }, { status: 403 })
    }

    const body = await request.json()
    const { keepTicketId, mergeTicketIds } = body

    if (!keepTicketId || !mergeTicketIds || !Array.isArray(mergeTicketIds)) {
      return NextResponse.json({ 
        error: 'Se requiere keepTicketId y mergeTicketIds[]',
        example: { keepTicketId: 'uuid-del-ticket-a-mantener', mergeTicketIds: ['uuid1', 'uuid2'] }
      }, { status: 400 })
    }

    const results = {
      emailsMoved: 0,
      activitiesMoved: 0,
      ticketsDeleted: 0,
      errors: [] as string[]
    }

    // Mover emails de los tickets a consolidar al ticket principal
    for (const ticketId of mergeTicketIds) {
      // Mover emails
      const { data: movedEmails, error: emailError } = await serviceSupabase
        .from('emails')
        .update({ ticket_id: keepTicketId })
        .eq('ticket_id', ticketId)
        .select('id')

      if (emailError) {
        results.errors.push(`Error moviendo emails de ${ticketId}: ${emailError.message}`)
      } else {
        results.emailsMoved += movedEmails?.length || 0
      }

      // Mover actividades
      const { data: movedActivities, error: activityError } = await serviceSupabase
        .from('activities')
        .update({ ticket_id: keepTicketId })
        .eq('ticket_id', ticketId)
        .select('id')

      if (activityError) {
        results.errors.push(`Error moviendo actividades de ${ticketId}: ${activityError.message}`)
      } else {
        results.activitiesMoved += movedActivities?.length || 0
      }

      // Eliminar ticket vacío
      const { error: deleteError } = await serviceSupabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)

      if (deleteError) {
        results.errors.push(`Error eliminando ticket ${ticketId}: ${deleteError.message}`)
      } else {
        results.ticketsDeleted++
      }
    }

    // Actualizar timestamp del ticket principal
    await serviceSupabase
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', keepTicketId)

    return NextResponse.json({
      success: true,
      results,
      message: `Consolidación completada: ${results.emailsMoved} emails y ${results.activitiesMoved} actividades movidas, ${results.ticketsDeleted} tickets eliminados`
    })
  } catch (error: any) {
    console.error('Error en consolidate:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET: Auto-detectar y mostrar tickets duplicados por thread_id
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

    // Buscar thread_ids que tienen emails en múltiples tickets
    const { data: duplicateThreads, error } = await serviceSupabase
      .rpc('find_duplicate_thread_tickets', { p_organization_id: platformOrg.id })

    // Si la función RPC no existe, usar query manual
    if (error) {
      console.log('RPC find_duplicate_thread_tickets no existe, usando query manual')
      
      // Query manual para encontrar duplicados
      const { data: emails } = await serviceSupabase
        .from('emails')
        .select('thread_id, ticket_id')
        .eq('organization_id', platformOrg.id)
        .not('thread_id', 'is', null)
        .not('ticket_id', 'is', null)

      // Agrupar por thread_id
      const threadToTickets: Record<string, Set<string>> = {}
      for (const e of emails || []) {
        if (!threadToTickets[e.thread_id]) {
          threadToTickets[e.thread_id] = new Set()
        }
        threadToTickets[e.thread_id].add(e.ticket_id)
      }

      // Filtrar threads con múltiples tickets
      const duplicates = []
      for (const [threadId, ticketIds] of Object.entries(threadToTickets)) {
        if (ticketIds.size > 1) {
          // Obtener info de tickets
          const { data: tickets } = await serviceSupabase
            .from('tickets')
            .select('id, ticket_number, subject, created_at')
            .in('id', Array.from(ticketIds))
            .order('created_at', { ascending: true })

          duplicates.push({
            thread_id: threadId,
            ticket_count: ticketIds.size,
            tickets: tickets || [],
            suggested_keep: tickets?.[0]?.id, // El más antiguo
            suggested_merge: tickets?.slice(1).map(t => t.id) || []
          })
        }
      }

      return NextResponse.json({
        duplicateThreads: duplicates,
        totalDuplicates: duplicates.length,
        hint: 'Usa POST con { keepTicketId, mergeTicketIds } para consolidar'
      })
    }

    return NextResponse.json({
      duplicateThreads,
      hint: 'Usa POST con { keepTicketId, mergeTicketIds } para consolidar'
    })
  } catch (error: any) {
    console.error('Error en GET consolidate:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





