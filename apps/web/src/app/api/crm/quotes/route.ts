/**
 * API Route: /api/crm/quotes
 * Gestión de cotizaciones
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const contactId = searchParams.get('contact_id');
  const companyId = searchParams.get('company_id');
  const dealId = searchParams.get('deal_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = supabase
      .schema('crm')
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain),
        deal:deals(id, title),
        assigned_user:users!quotes_assigned_to_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('organization_id', userWithOrg.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (contactId) query = query.eq('contact_id', contactId);
    if (companyId) query = query.eq('company_id', companyId);
    if (dealId) query = query.eq('deal_id', dealId);

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }

    return NextResponse.json({
      data: quotes,
      count,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error in GET /api/crm/quotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { line_items, ...quoteData } = body;

    // Crear cotización
    const { data: quote, error: quoteError } = await supabase
      .schema('crm')
      .from('quotes')
      .insert({
        ...quoteData,
        organization_id: userWithOrg.organizationId,
        created_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Crear line items si existen
    if (line_items && line_items.length > 0) {
      const itemsToInsert = line_items.map((item: any, index: number) => ({
        ...item,
        quote_id: quote.id,
        sort_order: index
      }));

      const { error: itemsError } = await supabase
        .schema('crm')
        .from('quote_line_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating quote items:', itemsError);
        // Revertir creación de quote
        await supabase.schema('crm').from('quotes').delete().eq('id', quote.id);
        return NextResponse.json({ error: 'Failed to create quote items' }, { status: 500 });
      }
    }

    // Obtener quote completa con line items
    const { data: completeQuote } = await supabase
      .schema('crm')
      .from('quotes')
      .select(`
        *,
        contact:contacts(id, full_name, email),
        company:companies(id, name, domain),
        deal:deals(id, title),
        line_items:quote_line_items(
          *,
          product:products(id, name, sku)
        )
      `)
      .eq('id', quote.id)
      .single();

    return NextResponse.json(completeQuote, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/quotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}








