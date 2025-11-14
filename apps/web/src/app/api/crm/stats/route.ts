/**
 * API Route: /api/crm/stats
 * Estadísticas del CRM para dashboard
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET() {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Llamar a la función RPC del schema crm
    const { data: stats, error } = await supabase
      .schema('crm')
      .rpc('get_stats', { org_id: userWithOrg.organizationId });

    if (error) {
      console.error('Error fetching CRM stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json(stats || {
      total_contacts: 0,
      total_companies: 0,
      new_contacts: 0,
      active_deals: 0,
      open_tickets: 0,
      deals_value: 0,
      unread_emails: 0
    });
  } catch (error) {
    console.error('Error in GET /api/crm/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}






