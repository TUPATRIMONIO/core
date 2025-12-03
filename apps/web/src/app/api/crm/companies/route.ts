import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export const runtime = 'nodejs';

/**
 * GET /api/crm/companies
 * Obtener lista de empresas
 */
export async function GET(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
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

    // Obtener empresas
    const { data: companies, error } = await supabase
      .from('crm.companies')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json(
        { error: error.message || 'Error obteniendo empresas' },
        { status: 500 }
      );
    }

    return NextResponse.json(companies || []);
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/companies
 * Crear una nueva empresa
 */
export async function POST(request: NextRequest) {
  // Verificar acceso a CRM
  const denied = await requireApplicationAccess(request, 'crm_sales');
  if (denied) return denied;

  try {
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

    // Validar campos requeridos
    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Preparar datos para insertar
    const insertData: any = {
      organization_id: orgUser.organization_id,
      name: body.name,
      legal_name: body.legal_name || null,
      domain: body.domain || null,
      type: body.type || 'prospect',
      industry: body.industry || null,
      company_size: body.company_size || null,
      website: body.website || null,
      phone: body.phone || null,
      email: (body.email && typeof body.email === 'string' && body.email.trim() !== '') ? body.email.trim() : null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      postal_code: body.postal_code || null,
      annual_revenue: body.annual_revenue || null,
      currency: body.currency || 'CLP',
      linkedin_url: body.linkedin_url || null,
      twitter_handle: body.twitter_handle || null,
      created_by: user.id,
    };

    // Crear empresa
    const { data: newCompany, error } = await supabase
      .from('crm.companies')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Insert data:', JSON.stringify(insertData, null, 2));
      return NextResponse.json(
        { 
          error: error.message || 'Error creando empresa',
          details: error.details || error.hint || 'Sin detalles adicionales',
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error: any) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

