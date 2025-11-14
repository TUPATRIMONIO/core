/**
 * API Route: /api/crm/companies/[id]/contacts
 * Contactos de una empresa específica
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
    const { data: contacts, error } = await supabase
      .schema('crm')
      .from('contacts')
      .select(`
        *,
        assigned_user:users!contacts_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .eq('company_id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching company contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error in GET /api/crm/companies/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







