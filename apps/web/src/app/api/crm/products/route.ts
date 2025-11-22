import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/crm/products
 * Obtener lista de productos
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

    // Obtener productos
    const { data: products, error } = await supabase
      .from('crm.products')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: error.message || 'Error obteniendo productos' },
        { status: 500 }
      );
    }

    return NextResponse.json(products || []);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/products
 * Crear un nuevo producto
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
      sku: body.sku || null,
      description: body.description || null,
      category: body.category || null,
      price: body.price || 0,
      currency: body.currency || 'CLP',
      cost: body.cost || null,
      billing_type: body.billing_type || 'one_time',
      billing_frequency: body.billing_frequency || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
    };

    // Crear producto
    const { data: newProduct, error } = await supabase
      .from('crm.products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: error.message || 'Error creando producto' },
        { status: 500 }
      );
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

