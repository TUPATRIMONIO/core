import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/crm/deals
 * Obtener lista de deals
 */
export async function GET(request: NextRequest) {
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

    // Obtener deals
    const { data: deals, error } = await supabase
      .from('crm.deals')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching deals:', error);
      return NextResponse.json(
        { error: error.message || 'Error obteniendo deals' },
        { status: 500 }
      );
    }

    return NextResponse.json(deals || []);
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/deals
 * Crear un nuevo deal
 */
export async function POST(request: NextRequest) {
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
      description: body.description || null,
      stage: body.stage || 'prospecting',
      value: body.value || 0,
      currency: body.currency || 'CLP',
      probability: body.probability || null,
      expected_close_date: body.expected_close_date || null,
      contact_id: body.contact_id || null,
      company_id: body.company_id || null,
      created_by: user.id,
    };

    // Crear deal
    const { data: newDeal, error } = await supabase
      .from('crm.deals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating deal:', error);
      return NextResponse.json(
        { error: error.message || 'Error creando deal' },
        { status: 500 }
      );
    }

    return NextResponse.json(newDeal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



