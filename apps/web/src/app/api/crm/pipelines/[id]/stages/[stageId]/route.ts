/**
 * API Route: /api/crm/pipelines/[id]/stages/[stageId]
 * CRUD de stage individual
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar que el usuario sea owner/admin
  const { data: roleData } = await supabase
    .schema('crm')
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

    // Verificar que el stage pertenece al pipeline
    const { data: existingStage } = await supabase
      .schema('crm')
      .from('pipeline_stages')
      .select('id')
      .eq('id', stageId)
      .eq('pipeline_id', id)
      .single();

    if (!existingStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, color, display_order, probability, is_final, final_type } = body;

    const { data, error } = await supabase
      .schema('crm')
      .from('pipeline_stages')
      .update({
        name,
        slug,
        color,
        display_order,
        probability,
        is_final,
        final_type
      })
      .eq('id', stageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating stage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/crm/pipelines/[id]/stages/[stageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verificar que el usuario sea owner/admin
  const { data: roleData } = await supabase
    .schema('crm')
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
      .select('id, organization_id, entity_type')
      .eq('id', id)
      .single();

    if (!pipeline || pipeline.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    // Verificar que el stage pertenece al pipeline
    const { data: existingStage } = await supabase
      .schema('crm')
      .from('pipeline_stages')
      .select('id')
      .eq('id', stageId)
      .eq('pipeline_id', id)
      .single();

    if (!existingStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Verificar que no haya entidades en esta etapa
    const entityTable = pipeline.entity_type + 's'; // tickets, contacts, etc.
    const { count } = await supabase
      .schema('crm')
      .from(entityTable as any)
      .select('id', { count: 'exact', head: true })
      .eq('stage_id', stageId);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete stage. ${count} ${entityTable} are in this stage.` 
      }, { status: 400 });
    }

    const { error } = await supabase
      .schema('crm')
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId);

    if (error) {
      console.error('Error deleting stage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/pipelines/[id]/stages/[stageId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


