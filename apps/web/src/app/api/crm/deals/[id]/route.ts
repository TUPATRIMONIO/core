/**
 * API Route: /api/crm/deals/[id]
 * Operaciones sobre un deal específico
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
    const { data: deal, error } = await supabase
      .schema('crm')
      .from('deals')
      .select(`
        *,
        contact:contacts(id, full_name, email, phone, company_name),
        company:companies(id, name, domain, type, website),
        assigned_user:users!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      console.error('Error fetching deal:', error);
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error in GET /api/crm/deals/[id]:', error);
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

    const { data: deal, error } = await supabase
      .schema('crm')
      .from('deals')
      .update(body)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain),
        assigned_user:users!deals_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Error in PATCH /api/crm/deals/[id]:', error);
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
      .from('deals')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error deleting deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/deals/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






