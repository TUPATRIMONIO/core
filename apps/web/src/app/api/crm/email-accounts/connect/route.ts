/**
 * API Route: /api/crm/email-accounts/connect
 * Inicia el flujo OAuth para conectar una nueva cuenta de Gmail
 * 
 * Query params:
 * - account_type: 'shared' | 'personal'
 * - display_name: (opcional) nombre para mostrar
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { getGmailAuthUrl } from '@/lib/gmail/oauth';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountType = searchParams.get('account_type') || 'shared';
    const displayName = searchParams.get('display_name') || '';

    // Generar URL de autorización con metadata en state
    const stateData = {
      org_id: userWithOrg.organizationId,
      user_id: userWithOrg.user.id,
      account_type: accountType,
      display_name: displayName
    };

    const authUrl = getGmailAuthUrl(JSON.stringify(stateData));

    return NextResponse.json({ auth_url: authUrl });
  } catch (error) {
    console.error('[GET /api/crm/email-accounts/connect]:', error);
    return NextResponse.json({ error: 'Failed to generate authorization URL' }, { status: 500 });
  }
}

