/**
 * API Route: /api/crm/inbox
 * Gestión del inbox de emails (threads agrupados)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Obtener inbox (lista de threads)
 * Query params:
 * - status: active, closed, archived
 * - unread_only: true/false
 * - account_id: filtrar por cuenta específica
 * - contact_id: filtrar por contacto
 * - limit, offset: paginación
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const accountId = searchParams.get('account_id');
    const contactId = searchParams.get('contact_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Usar Service Role para bypasear RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Construir query
    let query = supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .select('*', { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order('last_email_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    let threads = null;
    let count = 0;

    // Si hay filtro de cuenta, filtrar threads que tienen emails de esa cuenta
    if (accountId) {
      // Obtener thread_ids que tienen emails de esta cuenta
      const { data: emailsWithAccount } = await supabaseAdmin
        .schema('crm')
        .from('emails')
        .select('thread_id')
        .eq('organization_id', userWithOrg.organizationId)
        .or(`sent_from_account_id.eq.${accountId},received_in_account_id.eq.${accountId}`);

      const threadIds = Array.from(new Set(
        (emailsWithAccount || [])
          .map(e => e.thread_id)
          .filter(Boolean)
      ));

      if (threadIds.length > 0) {
        // Buscar threads que tienen esos gmail_thread_ids
        const result = await supabaseAdmin
          .schema('crm')
          .from('email_threads')
          .select('*', { count: 'exact' })
          .eq('organization_id', userWithOrg.organizationId)
          .in('gmail_thread_id', threadIds)
          .order('last_email_at', { ascending: false })
          .range(offset, offset + limit - 1);

        threads = result.data;
        count = result.count || 0;
      } else {
        threads = [];
        count = 0;
      }
    } else {
      // Sin filtro de cuenta, traer todos
      const result = await query;
      threads = result.data;
      count = result.count || 0;
    }

    const error = null;

    if (error) {
      console.error('[GET /api/crm/inbox] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: threads,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('[GET /api/crm/inbox] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

