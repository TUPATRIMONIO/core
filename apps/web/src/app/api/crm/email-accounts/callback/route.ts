/**
 * API Route: /api/crm/email-accounts/callback
 * Callback de OAuth para conectar cuentas de Gmail (compartidas o personales)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getTokensFromCode, getGmailProfile } from '@/lib/gmail/oauth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateString = searchParams.get('state');
  const error = searchParams.get('error');

  // Si el usuario rechazó la autorización
  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings/email-accounts?status=error', request.url)
    );
  }

  if (!code || !stateString) {
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings/email-accounts?status=missing', request.url)
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Parsear state
    const state = JSON.parse(stateString);
    const { org_id, user_id, account_type, display_name } = state;

    // Verificar que el usuario pertenece a la organización
    const { data: orgUser } = await supabase
      .schema('core')
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.redirect(
        new URL('/dashboard/crm/settings/email-accounts?status=forbidden', request.url)
      );
    }

    // Obtener tokens de OAuth
    const tokens = await getTokensFromCode(code);

    // Obtener perfil de Gmail para verificar
    const profile = await getGmailProfile(tokens);

    // Crear cuenta de email
    const accountData: any = {
      organization_id: org_id,
      email_address: profile.emailAddress,
      display_name: display_name || profile.emailAddress,
      account_type: account_type || 'shared',
      gmail_oauth_tokens: {
        ...tokens,
        email: profile.emailAddress
      },
      gmail_email_address: profile.emailAddress,
      connected_by: user_id,
      is_active: true
    };

    // Si es personal, asignar owner
    if (account_type === 'personal') {
      accountData.owner_user_id = user_id;
    }

    // Marcar como default (se puede cambiar después)
    accountData.is_default = true;

    console.log('[Email Account Callback] Creating account with data:', {
      email: accountData.email_address,
      type: accountData.account_type,
      org_id: org_id
    });

    // Usar Service Role para bypasear RLS en callback (ya validamos permisos arriba)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[Email Account Callback] Using Service Role to insert');

    const { data: account, error: accountError } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .insert(accountData)
      .select()
      .single();

    if (accountError) {
      console.error('[Email Account Callback] Error creating account:', accountError);
      console.error('[Email Account Callback] Account data was:', accountData);
      return NextResponse.redirect(
        new URL(`/dashboard/crm/settings/email-accounts?status=error&details=${encodeURIComponent(accountError.message)}`, request.url)
      );
    }

    console.log('[Email Account Callback] Account created successfully:', account.id);

    // Redirigir con éxito
    return NextResponse.redirect(
      new URL(`/dashboard/crm/settings/email-accounts?status=connected&email=${profile.emailAddress}&type=${account_type}`, request.url)
    );
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/dashboard/crm/settings/email-accounts?status=error', request.url)
    );
  }
}

