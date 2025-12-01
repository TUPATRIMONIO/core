import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/invoicing/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/invoicing/customers/:id
 * Obtiene un customer específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obtener customer
    const { data: customer, error } = await supabase
      .schema('invoicing')
      .from('customers')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: 'Customer no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('[GET /api/invoicing/customers/:id] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoicing/customers/:id
 * Actualiza un customer
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el customer existe y pertenece a la organización
    const { data: existingCustomer, error: checkError } = await supabase
      .schema('invoicing')
      .from('customers')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (checkError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar customer
    const { data: customer, error } = await supabase
      .schema('invoicing')
      .from('customers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Error actualizando customer: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer,
    });
  } catch (error: any) {
    console.error('[PATCH /api/invoicing/customers/:id] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

