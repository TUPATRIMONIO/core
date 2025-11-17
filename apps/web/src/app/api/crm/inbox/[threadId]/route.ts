/**
 * API Route: /api/crm/inbox/[threadId]
 * Obtener detalles de un thread/conversación específica
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Obtener thread completo con todos sus emails
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
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

    // Obtener thread
    const { data: thread, error: threadError } = await supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .select('*')
      .eq('id', threadId)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Obtener todos los emails del thread
    const { data: emails, error: emailsError } = await supabaseAdmin
      .schema('crm')
      .from('emails')
      .select('*')
      .eq('organization_id', userWithOrg.organizationId)
      .eq('thread_id', thread.gmail_thread_id)
      .order('sent_at', { ascending: true });

    if (emailsError) {
      return NextResponse.json({ error: emailsError.message }, { status: 500 });
    }

    // Marcar thread como leído
    await supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .update({ is_read: true })
      .eq('id', threadId);

    // Marcar emails como leídos
    await supabaseAdmin
      .schema('crm')
      .from('emails')
      .update({ is_read: true })
      .eq('thread_id', thread.gmail_thread_id)
      .eq('organization_id', userWithOrg.organizationId);

    return NextResponse.json({
      thread,
      emails: emails || []
    });
  } catch (error) {
    console.error('[GET /api/crm/inbox/[threadId]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Actualizar estado del thread
 * Body: { status, is_read }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
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

    const body = await request.json();
    
    const { data: thread, error } = await supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .update(body)
      .eq('id', threadId)
      .eq('organization_id', userWithOrg.organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(thread);
  } catch (error) {
    console.error('[PATCH /api/crm/inbox/[threadId]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar thread permanentemente
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Eliminar thread (cascade eliminará thread_labels y emails)
    const { error } = await supabaseAdmin
      .schema('crm')
      .from('email_threads')
      .delete()
      .eq('id', threadId)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/crm/inbox/[threadId]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

