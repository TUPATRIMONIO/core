/**
 * API Route: /api/crm/contacts/check-duplicate
 * Verifica si existe un contacto con el mismo email en la organización
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function POST(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Buscar contacto existente con ese email
    const { data: existingContact, error } = await supabase
      .schema('crm')
      .from('contacts')
      .select('id, full_name, email, company_name, job_title, status, created_at')
      .eq('organization_id', userWithOrg.organizationId)
      .ilike('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es OK
      console.error('[check-duplicate] Error:', error);
      return NextResponse.json({ error: 'Error checking duplicate' }, { status: 500 });
    }

    return NextResponse.json({
      exists: !!existingContact,
      contact: existingContact || null
    });
  } catch (error) {
    console.error('Error in POST /api/crm/contacts/check-duplicate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


