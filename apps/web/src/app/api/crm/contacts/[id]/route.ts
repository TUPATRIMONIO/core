/**
 * API Route: /api/crm/contacts/[id]
 * Operaciones sobre un contacto específico
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: contact, error } = await supabase
      .schema('crm')
      .from('contacts')
      .select(`
        *,
        company:companies(id, name, domain, type, website, phone, email),
        assigned_user:users!contacts_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      console.error('Error fetching contact:', error);
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error in GET /api/crm/contacts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Actualizar contacto
    const { data: contact, error } = await supabase
      .schema('crm')
      .from('contacts')
      .update(body)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .select(`
        *,
        company:companies(id, name, domain, type),
        assigned_user:users!contacts_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error in PATCH /api/crm/contacts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .schema('crm')
      .from('contacts')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error deleting contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/contacts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


