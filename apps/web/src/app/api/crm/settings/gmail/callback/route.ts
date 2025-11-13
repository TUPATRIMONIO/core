/**
 * API Route: /api/crm/settings/gmail/callback
 * Callback de OAuth para Gmail
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getTokensFromCode, getGmailProfile } from '@/lib/gmail/oauth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const organizationId = searchParams.get('state'); // org_id pasado en state
  const error = searchParams.get('error');

  // Si el usuario rechazó la autorización
  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings?gmail=error', request.url)
    );
  }

  if (!code || !organizationId) {
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings?gmail=missing', request.url)
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar que el usuario pertenece a la organización
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (!orgUser) {
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings?gmail=forbidden', request.url)
    );
  }

  try {
    // Obtener tokens de OAuth
    const tokens = await getTokensFromCode(code);

    // Obtener perfil de Gmail para verificar
    const profile = await getGmailProfile(tokens);

    // Guardar tokens en crm.settings
    const { error: settingsError } = await supabase
      .schema('crm')
      .from('settings')
      .upsert({
        organization_id: organizationId,
        gmail_oauth_tokens: tokens, // En producción: encriptar tokens
      }, {
        onConflict: 'organization_id'
      });

    if (settingsError) {
      console.error('Error saving Gmail tokens:', settingsError);
      return NextResponse.redirect(
        new URL('/dashboard/crm/settings?gmail=error', request.url)
      );
    }

    // Redirigir con éxito
    return NextResponse.redirect(
      new URL(`/dashboard/crm/settings?gmail=connected&email=${profile.emailAddress}`, request.url)
    );
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings?gmail=error', request.url)
    );
  }
}



