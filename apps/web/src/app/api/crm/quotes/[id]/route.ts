/**
 * API Route: /api/crm/quotes/[id]
 * Operaciones sobre una cotización específica
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: quote, error } = await supabase
      .schema('crm')
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, full_name, email, phone, company_name),
        company:companies(id, name, domain, email, phone, address, city, country),
        deal:deals(id, title, stage),
        assigned_user:users!quotes_assigned_to_fkey(id, first_name, last_name, email),
        line_items:quote_line_items(
          *,
          product:products(id, name, sku, description)
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error in GET /api/crm/quotes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { line_items, ...quoteData } = body;

    // Actualizar cotización
    const { data: quote, error: quoteError } = await supabase
      .schema('crm')
      .from('quotes')
      .update(quoteData)
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId)
      .select()
      .single();

    if (quoteError) {
      console.error('Error updating quote:', quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Si se actualizan line items, eliminar los viejos y crear nuevos
    if (line_items) {
      // Eliminar items existentes
      await supabase
        .schema('crm')
        .from('quote_line_items')
        .delete()
        .eq('quote_id', params.id);

      // Insertar nuevos items
      if (line_items.length > 0) {
        const itemsToInsert = line_items.map((item: any, index: number) => ({
          ...item,
          quote_id: params.id,
          sort_order: index
        }));

        await supabase
          .schema('crm')
          .from('quote_line_items')
          .insert(itemsToInsert);
      }
    }

    // Obtener quote actualizada con line items
    const { data: completeQuote } = await supabase
      .schema('crm')
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain),
        line_items:quote_line_items(
          *,
          product:products(id, name, sku)
        )
      `)
      .eq('id', params.id)
      .single();

    return NextResponse.json(completeQuote);
  } catch (error) {
    console.error('Error in PATCH /api/crm/quotes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { error } = await supabase
      .schema('crm')
      .from('quotes')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      console.error('Error deleting quote:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/crm/quotes/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








