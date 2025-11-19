/**
 * API Route: /api/crm/inbox/[threadId]/move
 * Mueve un thread a una carpeta (archivar, spam, custom, etc.)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function POST(
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

    const body = await request.json();
    const { folder_name } = body; // 'Archived', 'Spam', 'Trash', o nombre custom

    if (!folder_name) {
      return NextResponse.json({ error: 'folder_name is required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener carpeta destino
    const { data: folder } = await supabaseAdmin
      .schema('crm')
      .from('folders')
      .select('id')
      .eq('organization_id', userWithOrg.organizationId)
      .eq('name', folder_name)
      .single();

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Eliminar labels anteriores (excepto Inbox/Sent que son automáticos)
    await supabaseAdmin
      .schema('crm')
      .from('thread_labels')
      .delete()
      .eq('thread_id', threadId);

    // Agregar nuevo label
    const { error: labelError } = await supabaseAdmin
      .schema('crm')
      .from('thread_labels')
      .insert({
        thread_id: threadId,
        folder_id: folder.id,
        labeled_by: userWithOrg.user.id
      });

    if (labelError) {
      console.error('[Move Thread] Error:', labelError);
      return NextResponse.json({ error: labelError.message }, { status: 500 });
    }

    // Si es Archived o Trash, actualizar status del thread
    if (folder_name === 'Archived') {
      await supabaseAdmin
        .schema('crm')
        .from('email_threads')
        .update({ status: 'archived' })
        .eq('id', threadId);
    } else if (folder_name === 'Trash') {
      await supabaseAdmin
        .schema('crm')
        .from('email_threads')
        .update({ status: 'archived' }) // Trash también usa status archived
        .eq('id', threadId);
    }

    return NextResponse.json({ success: true, folder: folder_name });
  } catch (error) {
    console.error('[Move Thread] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

