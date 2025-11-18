/**
 * API Route: /api/crm/contacts
 * Gestión de contactos del CRM
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

  // Query params para filtros
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const companyId = searchParams.get('company_id');
  const assignedTo = searchParams.get('assigned_to');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Construir query (sin joins complejos para evitar errores)
    let query = supabase
      .schema('crm')
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    return NextResponse.json({
      data: contacts,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in GET /api/crm/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Verificar si ya existe un contacto con ese email
    if (body.email) {
      const { data: existingContact } = await supabase
        .schema('crm')
        .from('contacts')
        .select('id, full_name, email')
        .eq('organization_id', userWithOrg.organizationId)
        .ilike('email', body.email)
        .single();

      if (existingContact) {
        return NextResponse.json({ 
          error: 'duplicate_email',
          message: 'Ya existe un contacto con este correo electrónico',
          existingContact
        }, { status: 409 });
      }
    }

    // Crear contacto
    const { data: contact, error } = await supabase
      .schema('crm')
      .from('contacts')
      .insert({
        ...body,
        organization_id: userWithOrg.organizationId,
        created_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/crm/contacts] Error creating contact:', error);
      
      // Detectar error de duplicado (por si acaso pasa la validación previa)
      if (error.code === '23505' && error.message.includes('unique_email_per_org')) {
        return NextResponse.json({ 
          error: 'duplicate_email',
          message: 'Ya existe un contacto con este correo electrónico en tu organización'
        }, { status: 409 });
      }

      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}







