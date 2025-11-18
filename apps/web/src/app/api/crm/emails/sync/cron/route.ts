/**
 * API Route: /api/crm/emails/sync/cron
 * Endpoint para ejecutar sincronización automática (Vercel Cron o similar)
 * 
 * Este endpoint debe estar protegido con un secreto o IP whitelist en producción
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { syncEmailsForAccount } from '@/lib/gmail/sync';

export async function GET(request: Request) {
  // Verificar auth token (en producción)
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Crear cliente Supabase con service role (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Obtener todas las cuentas activas con sync habilitado Y que deban aparecer en inbox
    const { data: accounts, error: accountsError } = await supabase
      .schema('crm')
      .from('email_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('sync_enabled', true)
      .eq('sync_to_inbox', true);

    if (accountsError) {
      throw new Error(`Failed to fetch accounts: ${accountsError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        message: 'No accounts to sync',
        results: []
      });
    }

    console.log(`[Cron Sync] Processing ${accounts.length} accounts`);

    // Sincronizar cada cuenta
    const results = [];
    
    for (const account of accounts) {
      // Verificar si es tiempo de sincronizar
      const lastSync = account.last_sync_at ? new Date(account.last_sync_at) : null;
      const now = new Date();
      const minutesSinceSync = lastSync 
        ? (now.getTime() - lastSync.getTime()) / (1000 * 60)
        : Infinity;

      if (minutesSinceSync < account.sync_interval) {
        console.log(`[Cron Sync] Skipping ${account.email_address} (synced ${Math.floor(minutesSinceSync)}m ago)`);
        continue;
      }

      console.log(`[Cron Sync] Syncing: ${account.email_address}`);
      
      const result = await syncEmailsForAccount(
        supabase,
        account.id,
        account.organization_id,
        account, // Pasar cuenta completa
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

    console.log(`[Cron Sync] Complete: ${totalNew} new emails, ${totalThreads} threads`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        accounts_processed: results.length,
        accounts_skipped: accounts.length - results.length,
        new_emails: totalNew,
        updated_threads: totalThreads,
        errors: allErrors
      },
      results
    });
  } catch (error) {
    console.error('[Cron Sync] Fatal error:', error);
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Permitir método POST también (para testing manual)
export const POST = GET;

