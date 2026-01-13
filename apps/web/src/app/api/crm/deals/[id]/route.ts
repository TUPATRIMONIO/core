import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export const runtime = 'nodejs';

/**
 * GET /api/crm/deals/[id]
 * Obtener un deal por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);

    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Obtener deal
    const { data: deal, error } = await supabase
      .from('crm.deals')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !deal) {
      return NextResponse.json(
        { error: 'Deal no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
  } catch (error: any) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crm/deals/[id]
 * Actualizar un deal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);

    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que el deal existe y pertenece a la organización
    const { data: existingDeal } = await supabase
      .from('crm.deals')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.stage !== undefined) updateData.stage = body.stage;
    if (body.value !== undefined) updateData.value = body.value;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.probability !== undefined) updateData.probability = body.probability;
    if (body.expected_close_date !== undefined) updateData.expected_close_date = body.expected_close_date;
    if (body.actual_close_date !== undefined) updateData.actual_close_date = body.actual_close_date;

    // Actualizar deal
    const { data: updatedDeal, error } = await supabase
      .from('crm.deals')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating deal:', error);
      return NextResponse.json(
        { error: error.message || 'Error actualizando deal' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedDeal);
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/deals/[id]
 * Eliminar un deal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);

    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que el deal existe y pertenece a la organización
    const { data: existingDeal } = await supabase
      .from('crm.deals')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar deal
    const { error } = await supabase
      .from('crm.deals')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting deal:', error);
      return NextResponse.json(
        { error: error.message || 'Error eliminando deal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



