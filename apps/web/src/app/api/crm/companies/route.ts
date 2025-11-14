/**
 * API Route: /api/crm/companies
 * Gestión de empresas del CRM
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
  const type = searchParams.get('type');
  const industry = searchParams.get('industry');
  const assignedTo = searchParams.get('assigned_to');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .schema('crm')
      .from('companies')
      .select(`
        *,
        parent_company:companies!companies_parent_company_id_fkey(id, name),
        assigned_user:users!companies_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
      `, { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('type', type);
    if (industry) query = query.eq('industry', industry);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (search) {
      query = query.or(`name.ilike.%${search}%,legal_name.ilike.%${search}%,domain.ilike.%${search}%`);
    }

    const { data: companies, error, count } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    return NextResponse.json({
      data: companies,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in GET /api/crm/companies:', error);
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

    const { data: company, error } = await supabase
      .schema('crm')
      .from('companies')
      .insert({
        ...body,
        organization_id: userWithOrg.organizationId,
        created_by: userWithOrg.user.id
      })
      .select(`
        *,
        parent_company:companies!companies_parent_company_id_fkey(id, name),
        assigned_user:users!companies_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







