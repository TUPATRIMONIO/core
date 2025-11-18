/**
 * API Route: /api/crm/pipelines/[id]/permissions
 * Gestión de permisos de un pipeline
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar que el usuario sea owner/admin
  const { data: roleData } = await supabase
    .schema('core')
    .from('organization_users')
    .select('role:roles(level)')
    .eq('organization_id', userWithOrg.organizationId)
    .eq('user_id', userWithOrg.user.id)
    .single();

  const roleLevel = (roleData?.role as any)?.level || 0;
  if (roleLevel < 7) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    // Verificar que el pipeline pertenece a la organización
    const { data: pipeline } = await supabase
      .schema('crm')
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .schema('crm')
      .from('pipeline_permissions')
      .select(`
        *,
        user:users!pipeline_permissions_user_id_fkey(id, first_name, last_name, email, avatar_url),
        granted_by_user:users!pipeline_permissions_granted_by_fkey(id, first_name, last_name, email)
      `)
      .eq('pipeline_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/crm/pipelines/[id]/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar que el usuario sea owner/admin
  const { data: roleData } = await supabase
    .schema('core')
    .from('organization_users')
    .select('role:roles(level)')
    .eq('organization_id', userWithOrg.organizationId)
    .eq('user_id', userWithOrg.user.id)
    .single();

  const roleLevel = (roleData?.role as any)?.level || 0;
  if (roleLevel < 7) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    // Verificar que el pipeline pertenece a la organización
    const { data: pipeline } = await supabase
      .schema('crm')
      .from('pipelines')
      .select('id, organization_id')
      .eq('id', id)
      .single();

    if (!pipeline || pipeline.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    const body = await request.json();
    const { user_id, can_view, can_create, can_edit, can_delete, allowed_stages } = body;

    // Validaciones
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verificar que el usuario pertenece a la organización
    const { data: orgUser } = await supabase
      .schema('core')
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', pipeline.organization_id)
      .eq('user_id', user_id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 400 });
    }

    const { data, error } = await supabase
      .schema('crm')
      .from('pipeline_permissions')
      .insert({
        pipeline_id: id,
        user_id,
        can_view: can_view !== undefined ? can_view : true,
        can_create: can_create || false,
        can_edit: can_edit || false,
        can_delete: can_delete || false,
        allowed_stages: allowed_stages || [],
        granted_by: userWithOrg.user.id
      })
      .select(`
        *,
        user:users!pipeline_permissions_user_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Permission already exists for this user' }, { status: 409 });
      }
      console.error('Error creating permission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/pipelines/[id]/permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


