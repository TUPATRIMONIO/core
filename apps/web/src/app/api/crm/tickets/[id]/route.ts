import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export const runtime = 'nodejs';

/**
 * GET /api/crm/tickets/[id]
 * Obtener un ticket por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Obtener ticket
    const { data: ticket, error } = await supabase
      .from('crm.tickets')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crm/tickets/[id]
 * Actualizar un ticket
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que el ticket existe y pertenece a la organización
    const { data: existingTicket } = await supabase
      .from('crm.tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Si se marca como resuelto o cerrado, actualizar fechas
      if (body.status === 'resolved' && !existingTicket.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      if (body.status === 'closed' && !existingTicket.closed_at) {
        updateData.closed_at = new Date().toISOString();
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;

    // Actualizar ticket
    const { data: updatedTicket, error } = await supabase
      .from('crm.tickets')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return NextResponse.json(
        { error: error.message || 'Error actualizando ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/tickets/[id]
 * Eliminar un ticket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que el ticket existe y pertenece a la organización
    const { data: existingTicket } = await supabase
      .from('crm.tickets')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar ticket
    const { error } = await supabase
      .from('crm.tickets')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id);

    if (error) {
      console.error('Error deleting ticket:', error);
      return NextResponse.json(
        { error: error.message || 'Error eliminando ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



