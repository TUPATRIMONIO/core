/**
 * API Route: /api/crm/companies/[id]
 * Operaciones sobre una empresa específica
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
    const { data: company, error } = await supabase
      .schema('crm')
      .from('companies')
      .select(`
        *,
        parent_company:companies!companies_parent_company_id_fkey(id, name, domain),
        assigned_user:users!companies_assigned_to_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error in GET /api/crm/companies/[id]:', error);
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

    const { data: company, error } = await supabase
      .schema('crm')
      .from('companies')
      .update(body)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .select(`
        *,
        parent_company:companies!companies_parent_company_id_fkey(id, name),
        assigned_user:users!companies_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error in PATCH /api/crm/companies/[id]:', error);
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
      .from('companies')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error deleting company:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/companies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


