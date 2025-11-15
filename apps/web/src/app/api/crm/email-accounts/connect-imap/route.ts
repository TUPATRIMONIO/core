/**
 * API Route: /api/crm/email-accounts/connect-imap
 * Conecta cuenta de email vía IMAP/SMTP
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { testIMAPConnection } from '@/lib/email/imap-service';
import { testSMTPConnection } from '@/lib/email/smtp-service';
import { detectProvider, getProviderConfig } from '@/lib/email/providers';
import { encryptObject } from '@/lib/crypto';
import type { IMAPConfig } from '@/lib/email/imap-service';
import type { SMTPConfig } from '@/lib/email/smtp-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, account_type, display_name, provider: providerHint } = body;

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Detectar proveedor y obtener config
    const provider = providerHint || detectProvider(email);
    const providerConfig = getProviderConfig(provider);

    if (!providerConfig && provider !== 'custom') {
      return NextResponse.json({ 
        error: 'Unsupported email provider' 
      }, { status: 400 });
    }

    // Preparar configuraciones IMAP y SMTP
    const imapConfig: IMAPConfig = providerConfig ? {
      host: providerConfig.imap.host,
      port: providerConfig.imap.port,
      username: email,
      password,
      tls: providerConfig.imap.tls
    } : {
      // Config genérica para custom
      host: `imap.${email.split('@')[1]}`,
      port: 993,
      username: email,
      password,
      tls: true
    };

    const smtpConfig: SMTPConfig = providerConfig ? {
      host: providerConfig.smtp.host,
      port: providerConfig.smtp.port,
      username: email,
      password,
      secure: providerConfig.smtp.secure
    } : {
      // Config genérica para custom
      host: `smtp.${email.split('@')[1]}`,
      port: 587,
      username: email,
      password,
      secure: false
    };

    // Validar conexión IMAP
    console.log(`[Connect IMAP] Testing IMAP connection for ${email}`);
    try {
      await testIMAPConnection(imapConfig);
    } catch (error) {
      console.error('[Connect IMAP] IMAP test failed:', error);
      return NextResponse.json({ 
        error: 'IMAP connection failed',
        details: error instanceof Error ? error.message : 'Verifique usuario y contraseña'
      }, { status: 400 });
    }

    // Validar conexión SMTP
    console.log(`[Connect IMAP] Testing SMTP connection for ${email}`);
    try {
      await testSMTPConnection(smtpConfig);
    } catch (error) {
      console.error('[Connect IMAP] SMTP test failed:', error);
      return NextResponse.json({ 
        error: 'SMTP connection failed',
        details: error instanceof Error ? error.message : 'Verifique configuración SMTP'
      }, { status: 400 });
    }

    console.log(`[Connect IMAP] Validation successful for ${email}`);

    // Encriptar credenciales antes de guardar
    const encryptedIMAPConfig = encryptObject(imapConfig);
    const encryptedSMTPConfig = encryptObject(smtpConfig);

    // Preparar datos para guardar
    const accountData: any = {
      organization_id: userWithOrg.organizationId,
      email_address: email,
      display_name: display_name || email,
      account_type,
      connection_type: 'imap_smtp',
      imap_config: encryptedIMAPConfig,
      smtp_config: encryptedSMTPConfig,
      email_provider: provider,
      gmail_email_address: email,
      connected_by: userWithOrg.user.id,
      is_active: true,
      sync_enabled: true
    };

    if (account_type === 'personal') {
      accountData.owner_user_id = userWithOrg.user.id;
    }

    // Verificar si es la primera cuenta (marcarla como default)
    accountData.is_default = true;

    // Usar Service Role para bypasear RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: account, error: insertError } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .insert(accountData)
      .select()
      .single();

    if (insertError) {
      console.error('[Connect IMAP] Error saving account:', insertError);
      return NextResponse.json({ 
        error: 'Failed to save account',
        details: insertError.message
      }, { status: 500 });
    }

    console.log(`[Connect IMAP] Account created successfully: ${account.id}`);

    return NextResponse.json({
      success: true,
      account_id: account.id,
      email: email,
      connection_type: 'imap_smtp'
    }, { status: 201 });

  } catch (error) {
    console.error('[Connect IMAP] Exception:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

