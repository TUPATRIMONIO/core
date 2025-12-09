import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

/**
 * API Route: Obtener detalle de ticket
 * 
 * GET /api/admin/tickets/[id]
 */
export async function GET(
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

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Solo los platform admins pueden acceder a tickets' },
        { status: 403 }
      )
    }

    // Obtener ticket con relaciones
    const { data: ticket, error: ticketError } = await serviceSupabase
      .from('tickets')
      .select(`
        *,
        contact:contacts(*),
        assigned_user:users!tickets_assigned_to_fkey(*),
        order:orders(*),
        ticket_contacts:ticket_contacts(
          contact:contacts(*),
          contact_role
        )
      `)
      .eq('id', id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    // Obtener emails del ticket ordenados por fecha
    const { data: emails, error: emailsError } = await serviceSupabase
      .from('emails')
      .select('*')
      .eq('ticket_id', id)
      .order('sent_at', { ascending: true })

    if (emailsError) {
      console.error('Error obteniendo emails:', emailsError)
    }

    // Obtener actividades del ticket
    const { data: activities, error: activitiesError } = await serviceSupabase
      .from('activities')
      .select(`
        *,
        performed_by_user:users!activities_performed_by_fkey(id, email, first_name, last_name)
      `)
      .eq('ticket_id', id)
      .order('performed_at', { ascending: false })

    if (activitiesError) {
      console.error('Error obteniendo actividades:', activitiesError)
    }

    return NextResponse.json({
      ticket,
      emails: emails || [],
      activities: activities || [],
    })
  } catch (error: any) {
    console.error('Error en GET /api/admin/tickets/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener ticket' },
      { status: 500 }
    )
  }
}

/**
 * API Route: Actualizar ticket
 * 
 * PATCH /api/admin/tickets/[id]
 * Body: { status?, priority?, assigned_to?, order_id?, ... }
 */
export async function PATCH(
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

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Solo los platform admins pueden actualizar tickets' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validar order_id si se proporciona
    if (body.order_id) {
      const { data: order } = await serviceSupabase
        .from('orders')
        .select('id')
        .eq('id', body.order_id)
        .single()

      if (!order) {
        return NextResponse.json(
          { error: 'Pedido no encontrado' },
          { status: 404 }
        )
      }
    }

    // Actualizar ticket
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to
    if (body.order_id !== undefined) updateData.order_id = body.order_id
    if (body.category !== undefined) updateData.category = body.category
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.description !== undefined) updateData.description = body.description

    // Si se marca como resuelto/cerrado, actualizar resolved_at
    if (body.status === 'resolved' || body.status === 'closed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: updatedTicket, error: updateError } = await serviceSupabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedTicket) {
      console.error('Error actualizando ticket:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar ticket' },
        { status: 500 }
      )
    }

    // Crear actividad si hay cambios significativos
    if (body.status || body.assigned_to || body.order_id) {
      await serviceSupabase
        .from('activities')
        .insert({
          organization_id: updatedTicket.organization_id,
          contact_id: updatedTicket.contact_id,
          ticket_id: id,
          type: 'system',
          subject: 'Ticket actualizado',
          description: `Estado: ${body.status || updatedTicket.status}, Prioridad: ${body.priority || updatedTicket.priority}`,
          performed_by: user.id,
        })
    }

    return NextResponse.json({
      ticket: updatedTicket,
      message: 'Ticket actualizado exitosamente',
    })
  } catch (error: any) {
    console.error('Error en PATCH /api/admin/tickets/[id]:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar ticket' },
      { status: 500 }
    )
  }
}

