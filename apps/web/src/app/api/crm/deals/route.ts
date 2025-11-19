/**
 * API Route: /api/crm/deals
 * Gestión de deals/negocios del CRM
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stage = searchParams.get('stage');
  const contactId = searchParams.get('contact_id');
  const companyId = searchParams.get('company_id');
  const assignedTo = searchParams.get('assigned_to');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .schema('crm')
      .from('deals')
      .select(`
        *,
        contact:contacts(id, full_name, email, company_name),
        company:companies(id, name, domain, type),
        assigned_user:users!deals_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
      `, { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (stage) query = query.eq('stage', stage);
    if (contactId) query = query.eq('contact_id', contactId);
    if (companyId) query = query.eq('company_id', companyId);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const { data: deals, error, count } = await query;

    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    return NextResponse.json({
      data: deals,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in GET /api/crm/deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      .insert({
        ...body,
        organization_id: userWithOrg.organizationId,
        created_by: userWithOrg.user.id
      })
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain),
        assigned_user:users!deals_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/deals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








