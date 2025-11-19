/**
 * API Route: /api/crm/settings/gmail/disconnect
 * Desconecta Gmail eliminando los tokens almacenados
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function POST() {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Eliminar tokens de Gmail
    const { error } = await supabase
      .schema('crm')
      .from('settings')
      .update({ gmail_oauth_tokens: null })
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error disconnecting Gmail:', error);
      return NextResponse.json({ 
        error: 'Failed to disconnect Gmail' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Gmail Disconnect] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect Gmail' 
    }, { status: 500 });
  }
}

