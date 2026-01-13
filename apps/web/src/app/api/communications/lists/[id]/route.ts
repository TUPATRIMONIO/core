/**
 * API Route: Lista Individual
 * 
 * GET: Obtener lista por ID con miembros
 * PATCH: Actualizar lista
 * DELETE: Eliminar lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
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

    // Obtener lista
    const { data: list, error: listError } = await supabase
      .from('contact_lists')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });
    }

    // Obtener miembros de la lista
    const { data: members, error: membersError } = await supabase
      .from('contact_list_members')
      .select(`
        id,
        added_at,
        contact:crm.contacts (
          id,
          email,
          first_name,
          last_name,
          full_name,
          company_name,
          status
        )
      `)
      .eq('contact_list_id', id)
      .order('added_at', { ascending: false });

    return NextResponse.json({
      data: {
        ...list,
        members: members || [],
      },
    });
  } catch (error: any) {
    console.error('Error al obtener lista:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener lista' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Actualizar lista
    const { data, error } = await supabase
      .from('contact_lists')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al actualizar lista:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar lista' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
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

    // Verificar si la lista está siendo usada en campañas activas
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id')
      .eq('contact_list_id', id)
      .in('status', ['draft', 'scheduled', 'sending'])
      .limit(1);

    if (activeCampaigns && activeCampaigns.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la lista porque está siendo usada en campañas activas' },
        { status: 400 }
      );
    }

    // Eliminar lista (los miembros se eliminan automáticamente por CASCADE)
    const { error } = await supabase
      .from('contact_lists')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar lista:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar lista' },
      { status: 500 }
    );
  }
}

