/**
 * API Route: /api/crm/settings/gmail/authorize
 * Genera URL de autorización OAuth para Gmail
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { getGmailAuthUrl } from '@/lib/gmail/oauth';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Debug: verificar usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[Gmail Auth] User:', user?.email, 'Error:', authError);
    
    const userWithOrg = await getCurrentUserWithOrg();
    console.log('[Gmail Auth] UserWithOrg:', userWithOrg);
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      console.error('[Gmail Auth] No organization found for user');
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasUser: !!user,
          hasUserWithOrg: !!userWithOrg,
          hasOrgId: !!userWithOrg?.organizationId
        }
      }, { status: 401 });
    }

    // Generar URL de autorización
    const authUrl = getGmailAuthUrl(userWithOrg.organizationId);
    console.log('[Gmail Auth] Generated URL successfully for org:', userWithOrg.organizationId);

    return NextResponse.json({
      auth_url: authUrl
    });
  } catch (error) {
    console.error('[Gmail Auth] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}







