/**
 * API Route: /api/crm/pipelines/[id]
 * CRUD de pipeline individual
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

  try {
    const { data, error } = await supabase
      .schema('crm')
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages(*),
        created_by_user:users!pipelines_created_by_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
      }
      console.error('Error fetching pipeline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ordenar stages
    if (data.stages) {
      data.stages.sort((a: any, b: any) => a.display_order - b.display_order);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/crm/pipelines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const { name, category, description, color, is_default, is_active } = body;

    // Verificar que el pipeline pertenece a la organización
    const { data: existing } = await supabase
      .schema('crm')
      .from('pipelines')
      .select('organization_id, entity_type')
      .eq('id', id)
      .single();

    if (!existing || existing.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Si se marca como default, desmarcar otros
    if (is_default) {
      await supabase
        .schema('crm')
        .from('pipelines')
        .update({ is_default: false })
        .eq('organization_id', userWithOrg.organizationId)
        .eq('entity_type', existing.entity_type)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .schema('crm')
      .from('pipelines')
      .update({
        name,
        category,
        description,
        color,
        is_default,
        is_active
      })
      .eq('id', id)
      .select(`
        *,
        stages:pipeline_stages(*)
      `)
      .single();

    if (error) {
      console.error('Error updating pipeline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/crm/pipelines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    // Verificar que no haya entidades usando este pipeline
    const { data: pipeline } = await supabase
      .schema('crm')
      .from('pipelines')
      .select('entity_type, organization_id')
      .eq('id', id)
      .single();

    if (!pipeline || pipeline.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Verificar uso según entity_type
    const entityTable = pipeline.entity_type + 's'; // tickets, contacts, etc.
    const { count } = await supabase
      .schema('crm')
      .from(entityTable as any)
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', id);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete pipeline. ${count} ${entityTable} are using it.` 
      }, { status: 400 });
    }

    // Eliminar pipeline (CASCADE eliminará stages y permissions)
    const { error } = await supabase
      .schema('crm')
      .from('pipelines')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pipeline:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/pipelines/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


