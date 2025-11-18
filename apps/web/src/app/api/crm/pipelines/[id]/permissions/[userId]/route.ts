/**
 * API Route: /api/crm/pipelines/[id]/permissions/[userId]
 * CRUD de permiso individual
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
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
    const { can_view, can_create, can_edit, can_delete, allowed_stages } = body;

    const { data, error } = await supabase
      .schema('crm')
      .from('pipeline_permissions')
      .update({
        can_view,
        can_create,
        can_edit,
        can_delete,
        allowed_stages
      })
      .eq('pipeline_id', id)
      .eq('user_id', userId)
      .select(`
        *,
        user:users!pipeline_permissions_user_id_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
      }
      console.error('Error updating permission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/crm/pipelines/[id]/permissions/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
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

    const { error } = await supabase
      .schema('crm')
      .from('pipeline_permissions')
      .delete()
      .eq('pipeline_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting permission:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/pipelines/[id]/permissions/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


