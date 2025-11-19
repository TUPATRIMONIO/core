/**
 * API Route: /api/crm/pipelines/[id]/stages
 * Gestión de stages de un pipeline
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
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching stages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/crm/pipelines/[id]/stages:', error);
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
    const { name, slug, color, display_order, probability, is_final, final_type } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    // Si no se proporciona display_order, obtener el siguiente
    let order = display_order;
    if (order === undefined || order === null) {
      const { data: maxStage } = await supabase
        .schema('crm')
        .from('pipeline_stages')
        .select('display_order')
        .eq('pipeline_id', id)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();
      
      order = maxStage ? maxStage.display_order + 1 : 0;
    }

    const { data, error } = await supabase
      .schema('crm')
      .from('pipeline_stages')
      .insert({
        pipeline_id: id,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '_'),
        color: color || '#3b82f6',
        display_order: order,
        probability,
        is_final: is_final || false,
        final_type: final_type || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stage:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/pipelines/[id]/stages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


