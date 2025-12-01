import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/invoicing/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { CreateDocumentRequest, DocumentType } from '@/lib/invoicing/types';
import { emitDocument } from '@/lib/invoicing/emitter';

export const runtime = 'nodejs';

/**
 * POST /api/invoicing/documents
 * Crea y emite un documento tributario
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
    const body: CreateDocumentRequest = await request.json();

    // Validar datos
    if (!body.customer || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'customer e items son requeridos' },
        { status: 400 }
      );
    }

    // Determinar tipo de documento si no se especifica
    let documentType: DocumentType = body.document_type || 'stripe_invoice';
    if (!body.document_type) {
      const country = body.customer.country || 'CL';
      const { data } = await supabase.rpc('determine_document_type_by_country', {
        p_country_code: country,
        p_organization_id: auth.organizationId,
      });
      documentType = data || 'stripe_invoice';
    }

    // Determinar proveedor
    const { data: providerData } = await supabase.rpc('determine_provider', {
      p_document_type: documentType,
    });
    const provider = providerData as 'haulmer' | 'stripe';

    // Obtener o crear customer
    const { data: customerId } = await supabase.rpc('get_or_create_customer', {
      p_organization_id: auth.organizationId,
      p_tax_id: body.customer.tax_id,
      p_name: body.customer.name,
      p_email: body.customer.email || null,
      p_address: body.customer.address || null,
      p_city: body.customer.city || null,
      p_state: body.customer.state || null,
      p_postal_code: body.customer.postal_code || null,
      p_country: body.customer.country || 'CL',
      p_customer_type: body.customer.customer_type || 'empresa',
      p_giro: body.customer.giro || null,
    });

    if (!customerId) {
      return NextResponse.json(
        { error: 'Error creando/obteniendo customer' },
        { status: 500 }
      );
    }

    // Calcular totales
    const country = body.customer.country || 'CL';
    const { data: totalsData } = await supabase.rpc('calculate_document_totals', {
      p_items: body.items as any, // JSONB se pasa directamente
      p_country_code: country,
    });

    if (!totalsData || totalsData.length === 0) {
      return NextResponse.json(
        { error: 'Error calculando totales' },
        { status: 500 }
      );
    }

    const totals = totalsData[0];

    // Generar número de documento
    const { data: documentNumber } = await supabase.rpc('generate_document_number', {
      p_document_type: documentType,
      p_organization_id: auth.organizationId,
    });

    if (!documentNumber) {
      return NextResponse.json(
        { error: 'Error generando número de documento' },
        { status: 500 }
      );
    }

    // Crear documento
    const currency = body.currency || 'USD';
    const { data: document, error: docError } = await supabase
      .schema('invoicing')
      .from('documents')
      .insert({
        organization_id: auth.organizationId,
        customer_id: customerId,
        document_number: documentNumber,
        document_type: documentType,
        provider,
        status: 'pending',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        currency,
        order_id: body.order_id || null,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: `Error creando documento: ${docError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Crear items
    const itemsToInsert = body.items.map((item, index) => ({
      document_id: document.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      tax_exempt: item.tax_exempt || false,
      tax_rate: item.tax_rate || null,
      metadata: item.metadata || {},
    }));

    const { error: itemsError } = await supabase
      .schema('invoicing')
      .from('document_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Marcar documento como fallido
      await supabase.rpc('mark_document_failed', {
        p_document_id: document.id,
        p_error_message: `Error creando items: ${itemsError.message}`,
      });

      return NextResponse.json(
        { error: `Error creando items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // Emitir documento
    try {
      const { data: customerData } = await supabase
        .schema('invoicing')
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      const emissionResult = await emitDocument(
        document.id,
        documentType,
        provider,
        customerData,
        body.items,
        totals,
        currency,
        {
          sendEmail: body.send_email,
          orderId: body.order_id,
        }
      );

      // Marcar documento como emitido
      await supabase.rpc('mark_document_issued', {
        p_document_id: document.id,
        p_external_id: emissionResult.external_id,
        p_pdf_url: emissionResult.pdf_url || null,
        p_xml_url: emissionResult.xml_url || null,
        p_provider_response: emissionResult.provider_response,
      });

      // Obtener documento actualizado
      const { data: updatedDocument } = await supabase
        .schema('invoicing')
        .from('documents')
        .select('*')
        .eq('id', document.id)
        .single();

      return NextResponse.json({
        success: true,
        document: updatedDocument,
      });
    } catch (error: any) {
      // Marcar documento como fallido
      await supabase.rpc('mark_document_failed', {
        p_document_id: document.id,
        p_error_message: error.message,
      });

      return NextResponse.json(
        { error: `Error emitiendo documento: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[POST /api/invoicing/documents] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoicing/documents
 * Lista documentos de la organización
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

    // Obtener documentos
    const { data: documents, error } = await supabase
      .schema('invoicing')
      .from('documents')
      .select(`
        *,
        customers (*),
        document_items (*)
      `)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: `Error obteniendo documentos: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: documents || [],
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[GET /api/invoicing/documents] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

