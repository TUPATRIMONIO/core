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
    const sortBy = searchParams.get('sort_by') || 'date_desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Usar Service Role para bypasear RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Determinar ordenamiento
    let orderColumn = 'last_email_at';
    let orderAscending = false;
    
    switch (sortBy) {
      case 'date_asc':
        orderColumn = 'last_email_at';
        orderAscending = true;
        break;
      case 'date_desc':
        orderColumn = 'last_email_at';
        orderAscending = false;
        break;
      case 'sender_asc':
        orderColumn = 'last_email_from';
        orderAscending = true;
        break;
      case 'unread_first':
        orderColumn = 'is_read';
        orderAscending = true; // false primero (unread), luego true (read)
        break;
      default:
        orderColumn = 'last_email_at';
        orderAscending = false;
    }

    // Construir query
    let query = supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .select('*', { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order(orderColumn, { ascending: orderAscending })
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

    // Si hay filtro de cuenta, usar función RPC personalizada
    if (accountId) {
      console.log('[Inbox] Filtering by account:', accountId);
      
      const { data: filteredThreads, error: threadsError } = await supabaseAdmin
        .schema('crm')
        .rpc('get_threads_by_account', {
          org_id: userWithOrg.organizationId,
          account_uuid: accountId,
          result_limit: limit,
          result_offset: offset
        });

      console.log('[Inbox] RPC Threads found:', filteredThreads?.length, 'error:', threadsError);
      
      threads = filteredThreads;
      count = filteredThreads?.length || 0; // RPC no retorna count total, solo los resultados
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

