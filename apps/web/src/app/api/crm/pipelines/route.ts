/**
 * API Route: /api/crm/pipelines
 * Gestión de pipelines del CRM
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entity_type');
  const isActive = searchParams.get('is_active');
  const includeStages = searchParams.get('include_stages') === 'true';

  try {
    let query = supabase
      .schema('crm')
      .from('pipelines')
      .select(includeStages ? `
        *,
        stages:pipeline_stages(*)
      ` : '*')
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pipelines:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Ordenar stages por display_order si se incluyeron
    if (includeStages && data) {
      data.forEach((pipeline: any) => {
        if (pipeline.stages) {
          pipeline.stages.sort((a: any, b: any) => a.display_order - b.display_order);
        }
      });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/crm/pipelines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { name, entity_type, category, description, color, is_default, stages } = body;

    // Validaciones
    if (!name || !entity_type) {
      return NextResponse.json({ error: 'name and entity_type are required' }, { status: 400 });
    }

    // Si es default, desmarcar otros pipelines del mismo tipo
    if (is_default) {
      await supabase
        .schema('crm')
        .from('pipelines')
        .update({ is_default: false })
        .eq('organization_id', userWithOrg.organizationId)
        .eq('entity_type', entity_type);
    }

    // Crear pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .schema('crm')
      .from('pipelines')
      .insert({
        organization_id: userWithOrg.organizationId,
        name,
        type: entity_type === 'ticket' ? 'tickets' : 'deals', // Campo legacy, usar entity_type como default
        entity_type,
        category,
        description,
        color: color || '#3b82f6',
        is_default: is_default || false,
        is_active: true,
        created_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (pipelineError) {
      console.error('Error creating pipeline:', pipelineError);
      return NextResponse.json({ error: pipelineError.message }, { status: 500 });
    }

    // Crear stages si se proporcionaron
    if (stages && Array.isArray(stages) && stages.length > 0) {
      const stagesData = stages.map((stage: any, index: number) => ({
        pipeline_id: pipeline.id,
        name: stage.name,
        slug: stage.slug || stage.name.toLowerCase().replace(/\s+/g, '_'),
        color: stage.color || '#3b82f6',
        display_order: stage.display_order !== undefined ? stage.display_order : index,
        probability: stage.probability,
        is_final: stage.is_final || false,
        final_type: stage.final_type || null
      }));

      const { error: stagesError } = await supabase
        .schema('crm')
        .from('pipeline_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Error creating stages:', stagesError);
        // No fallar si los stages fallan, pero registrar error
      }
    }

    // Retornar pipeline con stages
    const { data: fullPipeline } = await supabase
      .schema('crm')
      .from('pipelines')
      .select(`
        *,
        stages:pipeline_stages(*)
      `)
      .eq('id', pipeline.id)
      .single();

    return NextResponse.json(fullPipeline, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/pipelines:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

