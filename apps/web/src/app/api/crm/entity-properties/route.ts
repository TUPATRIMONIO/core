/**
 * API Route: /api/crm/entity-properties
 * Gestión de propiedades personalizables de entidades
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
  const isVisible = searchParams.get('is_visible');

  try {
    let query = supabase
      .schema('crm')
      .from('entity_properties')
      .select('*')
      .eq('organization_id', userWithOrg.organizationId)
      .order('display_order', { ascending: true });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (isVisible !== null) {
      query = query.eq('is_visible', isVisible === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching entity properties:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/crm/entity-properties:', error);
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
  if (roleLevel < 8) { // Solo owners pueden crear propiedades
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      entity_type,
      property_name,
      property_key,
      property_type,
      options,
      is_required,
      default_value,
      description,
      display_order,
      is_visible
    } = body;

    // Validaciones
    if (!entity_type || !property_name || !property_key || !property_type) {
      return NextResponse.json({
        error: 'entity_type, property_name, property_key, and property_type are required'
      }, { status: 400 });
    }

    // Validar property_key (snake_case)
    if (!/^[a-z][a-z0-9_]*$/.test(property_key)) {
      return NextResponse.json({
        error: 'property_key must be in snake_case format (lowercase letters, numbers, and underscores)'
      }, { status: 400 });
    }

    // Validar que property_type es válido
    const validTypes = ['text', 'number', 'date', 'boolean', 'single_select', 'multi_select', 'user', 'contact', 'company', 'file', 'url'];
    if (!validTypes.includes(property_type)) {
      return NextResponse.json({
        error: `property_type must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // Si no se proporciona display_order, obtener el siguiente
    let order = display_order;
    if (order === undefined || order === null) {
      const { data: maxProperty } = await supabase
        .schema('crm')
        .from('entity_properties')
        .select('display_order')
        .eq('organization_id', userWithOrg.organizationId)
        .eq('entity_type', entity_type)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();
      
      order = maxProperty ? maxProperty.display_order + 1 : 0;
    }

    const { data, error } = await supabase
      .schema('crm')
      .from('entity_properties')
      .insert({
        organization_id: userWithOrg.organizationId,
        entity_type,
        property_name,
        property_key,
        property_type,
        options: options || [],
        is_required: is_required || false,
        default_value,
        description,
        display_order: order,
        is_visible: is_visible !== undefined ? is_visible : true,
        created_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ 
          error: 'A property with this key already exists for this entity type' 
        }, { status: 409 });
      }
      console.error('Error creating entity property:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/entity-properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


