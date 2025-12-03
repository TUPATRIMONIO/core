import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export const runtime = 'nodejs';

/**
 * GET /api/crm/products/[id]
 * Obtener un producto por ID
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

    // Obtener producto
    const { data: product, error } = await supabase
      .from('crm.products')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/crm/products/[id]
 * Actualizar un producto
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

    // Verificar que el producto existe y pertenece a la organización
    const { data: existingProduct } = await supabase
      .from('crm.products')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.cost !== undefined) updateData.cost = body.cost;
    if (body.billing_type !== undefined) updateData.billing_type = body.billing_type;
    if (body.billing_frequency !== undefined) updateData.billing_frequency = body.billing_frequency;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Actualizar producto
    const { data: updatedProduct, error } = await supabase
      .from('crm.products')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: error.message || 'Error actualizando producto' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/crm/products/[id]
 * Eliminar un producto
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

    // Verificar que el producto existe y pertenece a la organización
    const { data: existingProduct } = await supabase
      .from('crm.products')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar producto
    const { error } = await supabase
      .from('crm.products')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: error.message || 'Error eliminando producto' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



