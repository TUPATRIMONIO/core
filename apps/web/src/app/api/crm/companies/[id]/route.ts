import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/crm/companies/[id]
 * Obtener una empresa por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Obtener empresa
    const { data: company, error } = await supabase
      .from('crm.companies')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (error || !company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error: any) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crm/companies/[id]
 * Actualizar una empresa
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe y pertenece a la organización
    const { data: existingCompany } = await supabase
      .from('crm.companies')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.legal_name !== undefined) updateData.legal_name = body.legal_name;
    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.company_size !== undefined) updateData.company_size = body.company_size;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.country !== undefined) updateData.country = body.country;
    if (body.postal_code !== undefined) updateData.postal_code = body.postal_code;
    if (body.annual_revenue !== undefined) updateData.annual_revenue = body.annual_revenue;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.linkedin_url !== undefined) updateData.linkedin_url = body.linkedin_url;
    if (body.twitter_handle !== undefined) updateData.twitter_handle = body.twitter_handle;

    // Actualizar empresa
    const { data: updatedCompany, error } = await supabase
      .from('crm.companies')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return NextResponse.json(
        { error: error.message || 'Error actualizando empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCompany);
  } catch (error: any) {
    console.error('Error updating company:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/companies/[id]
 * Eliminar una empresa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
        { status: 400 }
      );
    }

    // Verificar que la empresa existe y pertenece a la organización
    const { data: existingCompany } = await supabase
      .from('crm.companies')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar empresa
    const { error } = await supabase
      .from('crm.companies')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id);

    if (error) {
      console.error('Error deleting company:', error);
      return NextResponse.json(
        { error: error.message || 'Error eliminando empresa' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



