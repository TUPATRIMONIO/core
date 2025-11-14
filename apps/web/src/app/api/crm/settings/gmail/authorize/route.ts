/**
 * API Route: /api/crm/settings/gmail/authorize
 * Genera URL de autorización OAuth para Gmail
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { getGmailAuthUrl } from '@/lib/gmail/oauth';

export async function GET() {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generar URL de autorización
    const authUrl = getGmailAuthUrl(userWithOrg.organizationId);

    return NextResponse.json({
      auth_url: authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}






