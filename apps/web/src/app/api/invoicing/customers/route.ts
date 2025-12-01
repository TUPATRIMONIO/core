import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/invoicing/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/invoicing/customers
 * Crea un nuevo customer
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const body = await request.json();

    // Validar datos requeridos
    if (!body.tax_id || !body.name) {
      return NextResponse.json(
        { error: 'tax_id y name son requeridos' },
        { status: 400 }
      );
    }

    // Crear o obtener customer
    const { data: customerId, error } = await supabase.rpc('get_or_create_customer', {
      p_organization_id: auth.organizationId,
      p_tax_id: body.tax_id,
      p_name: body.name,
      p_email: body.email || null,
      p_address: body.address || null,
      p_city: body.city || null,
      p_state: body.state || null,
      p_postal_code: body.postal_code || null,
      p_country: body.country || 'CL',
      p_customer_type: body.customer_type || 'empresa',
      p_giro: body.giro || null,
    });

    if (error || !customerId) {
      return NextResponse.json(
        { error: `Error creando customer: ${error?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Obtener customer creado
    const { data: customer } = await supabase
      .schema('invoicing')
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    console.error('[POST /api/invoicing/customers] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoicing/customers
 * Lista customers de la organización
 */
export async function GET(request: NextRequest) {
  try {
    // Autenticar
    const auth = await authenticateRequest(request);
    if (!auth.authenticated || !auth.organizationId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');

    let query = supabase
      .schema('invoicing')
      .from('customers')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Buscar por nombre o tax_id si se proporciona
    if (search) {
      query = query.or(`name.ilike.%${search}%,tax_id.ilike.%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Error obteniendo customers: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customers: customers || [],
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[GET /api/invoicing/customers] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

