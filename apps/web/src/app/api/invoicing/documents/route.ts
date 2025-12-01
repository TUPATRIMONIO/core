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
  let documentId: string | null = null;
  
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
    const { data: providerData, error: providerError } = await supabase.rpc('determine_provider', {
      p_document_type: documentType,
    });
    
    if (providerError) {
      console.error('[POST /api/invoicing/documents] Error en determine_provider:', providerError);
      return NextResponse.json(
        { error: `Error determinando proveedor: ${providerError.message}` },
        { status: 500 }
      );
    }
    
    const provider = providerData as 'haulmer' | 'stripe';

    // Obtener o crear customer
    const { data: customerId, error: customerError } = await supabase.rpc('get_or_create_customer', {
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

    if (customerError) {
      console.error('[POST /api/invoicing/documents] Error en get_or_create_customer:', customerError);
      return NextResponse.json(
        { error: `Error creando/obteniendo customer: ${customerError.message}` },
        { status: 500 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Error creando/obteniendo customer: customerId es null' },
        { status: 500 }
      );
    }

    // Calcular totales
    const country = body.customer.country || 'CL';
    const { data: totalsData, error: totalsError } = await supabase.rpc('calculate_document_totals', {
      p_items: body.items as any,
      p_country_code: country,
    });

    if (totalsError) {
      console.error('[POST /api/invoicing/documents] Error en calculate_document_totals:', totalsError);
      return NextResponse.json(
        { error: `Error calculando totales: ${totalsError.message}` },
        { status: 500 }
      );
    }

    if (!totalsData || totalsData.length === 0) {
      return NextResponse.json(
        { error: 'Error calculando totales: datos vacíos' },
        { status: 500 }
      );
    }

    const totals = totalsData[0];

    // Generar número de documento
    const { data: documentNumber, error: docNumberError } = await supabase.rpc('generate_document_number', {
      p_document_type: documentType,
      p_organization_id: auth.organizationId,
    });

    if (docNumberError) {
      console.error('[POST /api/invoicing/documents] Error en generate_document_number:', docNumberError);
      return NextResponse.json(
        { error: `Error generando número de documento: ${docNumberError.message}` },
        { status: 500 }
      );
    }

    if (!documentNumber) {
      return NextResponse.json(
        { error: 'Error generando número de documento: documentNumber es null' },
        { status: 500 }
      );
    }

    // Crear documento usando función RPC
    const currency = body.currency || 'USD';
    const { data: newDocumentId, error: docError } = await supabase.rpc('create_invoicing_document', {
      p_organization_id: auth.organizationId,
      p_customer_id: customerId,
      p_document_number: documentNumber,
      p_document_type: documentType,
      p_provider: provider,
      p_status: 'pending',
      p_subtotal: totals.subtotal,
      p_tax: totals.tax,
      p_total: totals.total,
      p_currency: currency,
      p_order_id: body.order_id || null,
      p_metadata: body.metadata || {},
    });

    if (docError || !newDocumentId) {
      console.error('[POST /api/invoicing/documents] Error en create_invoicing_document:', docError);
      return NextResponse.json(
        { error: `Error creando documento: ${docError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    documentId = newDocumentId;

    // Crear items usando función RPC
    const itemsForRpc = body.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
      tax_exempt: item.tax_exempt || false,
    }));

    const { error: itemsError } = await supabase.rpc('create_invoicing_document_items', {
      p_document_id: documentId,
      p_items: itemsForRpc,
    });

    if (itemsError) {
      console.error('[POST /api/invoicing/documents] Error en create_invoicing_document_items:', itemsError);
      // Marcar documento como fallido
      await supabase.rpc('mark_document_failed', {
        p_document_id: documentId,
        p_error_message: `Error creando items: ${itemsError.message}`,
      });

      return NextResponse.json(
        { error: `Error creando items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // Emitir documento
    try {
      // Obtener datos del customer usando función RPC
      const { data: customerDataRows } = await supabase.rpc('get_invoicing_customer', {
        p_customer_id: customerId,
      });
      
      const customerData = customerDataRows?.[0] || null;

      const emissionResult = await emitDocument(
        documentId,
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
        p_document_id: documentId,
        p_external_id: emissionResult.external_id,
        p_pdf_url: emissionResult.pdf_url || null,
        p_xml_url: emissionResult.xml_url || null,
        p_provider_response: emissionResult.provider_response,
      });

      // Obtener documento actualizado usando función RPC
      const { data: updatedDocRows } = await supabase.rpc('get_invoicing_document', {
        p_document_id: documentId,
      });

      return NextResponse.json({
        success: true,
        document: updatedDocRows?.[0] || null,
      });
    } catch (error: any) {
      console.error('[POST /api/invoicing/documents] Error emitiendo documento:', error);
      
      // Marcar documento como fallido solo si existe
      if (documentId) {
        try {
          await supabase.rpc('mark_document_failed', {
            p_document_id: documentId,
            p_error_message: error.message || 'Error desconocido',
          });
        } catch (markError) {
          console.error('[POST /api/invoicing/documents] Error marcando documento como fallido:', markError);
        }
      }

      return NextResponse.json(
        { 
          error: `Error emitiendo documento: ${error.message}`,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[POST /api/invoicing/documents] Error general:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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
    const status = searchParams.get('status') || undefined;

    // Obtener documentos usando función RPC
    const { data: documents, error } = await supabase.rpc('list_invoicing_documents', {
      p_organization_id: auth.organizationId,
      p_limit: limit,
      p_offset: offset,
      p_status: status || null,
    });

    if (error) {
      console.error('[GET /api/invoicing/documents] Error:', error);
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
