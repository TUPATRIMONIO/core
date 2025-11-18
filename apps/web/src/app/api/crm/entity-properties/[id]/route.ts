/**
 * API Route: /api/crm/entity-properties/[id]
 * CRUD de entity property individual
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
      .from('entity_properties')
      .select(`
        *,
        created_by_user:users!entity_properties_created_by_fkey(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      console.error('Error fetching entity property:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/crm/entity-properties/[id]:', error);
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
  if (roleLevel < 8) { // Solo owners pueden editar propiedades
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    // Verificar que la propiedad pertenece a la organización
    const { data: existing } = await supabase
      .schema('crm')
      .from('entity_properties')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!existing || existing.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      property_name,
      options,
      is_required,
      default_value,
      description,
      display_order,
      is_visible
    } = body;

    // No permitir cambiar property_key, entity_type, o property_type después de crear
    const { data, error } = await supabase
      .schema('crm')
      .from('entity_properties')
      .update({
        property_name,
        options,
        is_required,
        default_value,
        description,
        display_order,
        is_visible
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entity property:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/crm/entity-properties/[id]:', error);
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
  if (roleLevel < 8) { // Solo owners pueden eliminar propiedades
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    // Verificar que la propiedad pertenece a la organización
    const { data: existing } = await supabase
      .schema('crm')
      .from('entity_properties')
      .select('organization_id, property_key, entity_type')
      .eq('id', id)
      .single();

    if (!existing || existing.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // IMPORTANTE: Al eliminar una propiedad, los valores en custom_fields de entidades
    // seguirán existiendo pero ya no serán visibles/editables.
    // Esto está bien porque el campo custom_fields es JSONB flexible.

    const { error } = await supabase
      .schema('crm')
      .from('entity_properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entity property:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/entity-properties/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


