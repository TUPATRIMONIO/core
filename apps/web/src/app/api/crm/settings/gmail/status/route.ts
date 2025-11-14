/**
 * API Route: /api/crm/settings/gmail/status
 * Verifica si Gmail está conectado para la organización actual
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET() {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ 
        isConnected: false,
        email: null 
      });
    }

    // Verificar si hay tokens de Gmail guardados
    const { data: settings } = await supabase
      .schema('crm')
      .from('settings')
      .select('gmail_oauth_tokens')
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    const isConnected = !!settings?.gmail_oauth_tokens;
    
    // Si está conectado, obtener el email del token
    let email = null;
    if (isConnected && settings.gmail_oauth_tokens) {
      try {
        const tokens = settings.gmail_oauth_tokens as any;
        email = tokens.email || null;
      } catch (error) {
        console.error('Error parsing tokens:', error);
      }
    }

    return NextResponse.json({
      isConnected,
      email
    });
  } catch (error) {
    console.error('[Gmail Status] Error:', error);
    return NextResponse.json({ 
      isConnected: false,
      email: null 
    });
  }
}

