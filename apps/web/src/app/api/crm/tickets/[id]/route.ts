/**
 * API Route: /api/crm/tickets/[id]
 * Operaciones sobre un ticket específico
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
    const { data: ticket, error } = await supabase
      .schema('crm')
      .from('tickets')
      .select(`
        *,
        contact:contacts(id, full_name, email, phone),
        company:companies(id, name, domain)
      `)
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      console.error('Error fetching ticket:', error);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error in GET /api/crm/tickets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    console.log('PATCH ticket:', id, body); // Debug

    const { data: ticket, error } = await supabase
      .schema('crm')
      .from('tickets')
      .update(body)
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain)
      `)
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Ticket updated successfully:', ticket.ticket_number); // Debug
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error in PATCH /api/crm/tickets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const { error } = await supabase
      .schema('crm')
      .from('tickets')
      .delete()
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error deleting ticket:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/tickets/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








