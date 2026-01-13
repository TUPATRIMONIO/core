/**
 * API Route: Listas de Contactos
 * 
 * GET: Listar listas de la organización
 * POST: Crear nueva lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

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
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);

    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Obtener listas
    const { data, error } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error al obtener listas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener listas' },
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
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);

    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json({ error: 'name es requerido' }, { status: 400 });
    }

    // Crear lista
    const { data, error } = await supabase
      .from('contact_lists')
      .insert({
        organization_id: organizationId,
        name,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al crear lista:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear lista' },
      { status: 500 }
    );
  }
}

