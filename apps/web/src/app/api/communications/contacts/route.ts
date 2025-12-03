/**
 * API Route: Contactos para Email Marketing
 * 
 * GET: Listar contactos básicos (solo campos necesarios para email marketing)
 * POST: Crear contacto nuevo (guarda en crm.contacts)
 * 
 * Esta API permite gestionar contactos cuando Email Marketing está habilitado
 * pero CRM puede estar deshabilitado. Los contactos se guardan en crm.contacts
 * para mantener una sola fuente de verdad.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export async function GET(request: NextRequest) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Construir query - Solo campos básicos necesarios para email marketing
    let query = supabase
      .from('contacts')
      .select('id, email, first_name, last_name, full_name, phone, company_name')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Búsqueda por email o nombre
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener contactos:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener contactos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error en GET /api/communications/contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener organización del usuario
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, first_name, last_name, phone, company_name } = body;

    // Validaciones básicas
    if (!email || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      return NextResponse.json(
        { error: 'Email válido es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el contacto ya existe
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgUser.organization_id)
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingContact) {
      return NextResponse.json(
        { error: 'Ya existe un contacto con este email' },
        { status: 409 }
      );
    }

    // Crear contacto - Solo campos básicos necesarios para email marketing
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: orgUser.organization_id,
        email: email.toLowerCase().trim(),
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        phone: phone?.trim() || null,
        company_name: company_name?.trim() || null,
        created_by: user.id,
        status: 'lead', // Estado por defecto
        source: 'email_marketing', // Marcar que viene de email marketing
      })
      .select('id, email, first_name, last_name, full_name, phone, company_name')
      .single();

    if (error) {
      console.error('Error al crear contacto:', error);
      return NextResponse.json(
        { error: error.message || 'Error al crear contacto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (error: any) {
    console.error('Error en POST /api/communications/contacts:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

