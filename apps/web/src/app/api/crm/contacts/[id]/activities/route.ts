/**
 * API Route: /api/crm/contacts/[id]/activities
 * Timeline de actividades de un contacto
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
    const { data: activities, error } = await supabase
      .schema('crm')
      .from('activities')
      .select(`
        *,
        performed_by_user:users!activities_performed_by_fkey(id, first_name, last_name, email, avatar_url)
      `)
      .eq('contact_id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .order('performed_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error in GET /api/crm/contacts/[id]/activities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


