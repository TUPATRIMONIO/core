/**
 * API Route: /api/crm/emails/sync
 * Sincroniza emails de todas las cuentas activas de la organización
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';
import { syncEmailsForAccount } from '@/lib/gmail/sync';

/**
 * POST - Ejecutar sincronización de emails
 * Query params:
 * - account_id: (opcional) sincronizar solo una cuenta específica
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar Service Role para bypasear RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    let accountsToSync;

    if (accountId) {
      // Sincronizar solo una cuenta específica
      const { data: account } = await supabaseAdmin
        .schema('crm')
        .from('email_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('organization_id', userWithOrg.organizationId)
        .eq('is_active', true)
        .single();

      accountsToSync = account ? [account] : [];
    } else {
      // Sincronizar todas las cuentas activas de la org
      const { data: accounts } = await supabaseAdmin
        .schema('crm')
        .from('email_accounts')
        .select('*')
        .eq('organization_id', userWithOrg.organizationId)
        .eq('is_active', true)
        .eq('sync_enabled', true);

      accountsToSync = accounts || [];
    }

    if (accountsToSync.length === 0) {
      return NextResponse.json({ 
        message: 'No accounts to sync',
        results: []
      });
    }

    // Sincronizar cada cuenta
    const results = [];
    
    for (const account of accountsToSync) {
      console.log(`[Sync] Processing account: ${account.email_address} (${account.connection_type})`);
      
      const result = await syncEmailsForAccount(
        supabaseAdmin,
        account.id,
        userWithOrg.organizationId,
        account, // Pasar cuenta completa en lugar de solo tokens
        account.last_sync_at
      );

      results.push({
        account_id: account.id,
        email_address: account.email_address,
        ...result
      });
    }

    const totalNew = results.reduce((sum, r) => sum + r.newEmails, 0);
    const totalThreads = results.reduce((sum, r) => sum + r.updatedThreads, 0);
    const allErrors = results.flatMap(r => r.errors);

    return NextResponse.json({
      success: true,
      summary: {
        accounts_synced: accountsToSync.length,
        new_emails: totalNew,
        updated_threads: totalThreads,
        errors: allErrors
      },
      results
    });
  } catch (error) {
    console.error('[POST /api/crm/emails/sync] Error:', error);
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

