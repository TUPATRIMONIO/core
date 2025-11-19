/**
 * API Route: /api/crm/folders
 * Gestión de carpetas de email (sistema y personalizadas)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Listar todas las carpetas de la organización
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: folders, error } = await supabaseAdmin
      .schema('crm')
      .from('folders')
      .select('*')
      .eq('organization_id', userWithOrg.organizationId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[GET /api/crm/folders] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: folders || [] });
  } catch (error) {
    console.error('[GET /api/crm/folders] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Crear carpeta personalizada
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, icon, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: folder, error } = await supabaseAdmin
      .schema('crm')
      .from('folders')
      .insert({
        organization_id: userWithOrg.organizationId,
        name,
        type: 'custom',
        icon: icon || 'Folder',
        color: color || '#8b5cf6',
        created_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/crm/folders] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('[POST /api/crm/folders] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

