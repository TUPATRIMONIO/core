/**
 * Processor para emisión de documentos tributarios externos
 * 
 * Este módulo procesa solicitudes de emisión de documentos y llama
 * a los proveedores correspondientes (Haulmer o Stripe).
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { DocumentRequest, EmissionResult, ProviderType } from './document-types';
import { emitHaulmerInvoice } from '@/lib/haulmer/sync';
import { createStripeInvoiceForOrder } from '@/lib/stripe/sync';

/**
 * Procesa una solicitud de emisión de documento
 * 
 * @param requestId - ID de la solicitud en invoicing.document_requests
 * @returns true si la emisión fue exitosa
 */
export async function processDocumentRequest(requestId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  console.log('[processDocumentRequest] Iniciando procesamiento:', { requestId });

  try {
    // Obtener solicitud
    const { data: request, error: requestError } = await supabase
      .from('document_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[processDocumentRequest] Solicitud no encontrada:', {
        requestId,
        error: requestError?.message,
      });
      return false;
    }

    // Verificar que no esté ya procesada
    if (request.status === 'completed') {
      console.log('[processDocumentRequest] Solicitud ya completada:', { requestId });
      return true;
    }

    // Verificar intentos máximos
    if (request.attempts >= request.max_attempts) {
      console.error('[processDocumentRequest] Máximo de intentos alcanzado:', {
        requestId,
        attempts: request.attempts,
        max_attempts: request.max_attempts,
      });
      await markRequestAsFailed(requestId, 'Máximo de intentos alcanzado');
      return false;
    }

    // Marcar como procesando
    await supabase
      .from('document_requests')
      .update({
        status: 'processing',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    // Procesar según el proveedor
    const result = await emitDocument(request as DocumentRequest);

    if (result) {
      // Marcar como completada
      await markRequestAsCompleted(requestId, result);
      console.log('[processDocumentRequest] Documento emitido exitosamente:', {
        requestId,
        external_id: result.external_id,
      });
      return true;
    } else {
      throw new Error('Emisión falló sin error específico');
    }
  } catch (error: any) {
    console.error('[processDocumentRequest] Error procesando solicitud:', {
      requestId,
      error: error.message,
    });
    
    await markRequestAsFailed(requestId, error.message);
    return false;
  }
}

/**
 * Emite el documento según el proveedor
 */
async function emitDocument(request: DocumentRequest): Promise<EmissionResult> {
  const supabase = createServiceRoleClient();

  console.log('[emitDocument] Emitiendo documento:', {
    requestId: request.id,
    provider: request.provider,
    documentType: request.document_type,
  });

  // Obtener datos de la orden e invoice
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', request.order_id)
    .single();

  if (orderError || !order) {
    throw new Error(`Orden no encontrada: ${orderError?.message}`);
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', request.invoice_id)
    .single();

  if (invoiceError || !invoice) {
    throw new Error(`Factura no encontrada: ${invoiceError?.message}`);
  }

  // Obtener datos de la organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', request.organization_id)
    .single();

  if (orgError || !org) {
    throw new Error(`Organización no encontrada: ${orgError?.message}`);
  }

  // Emitir según el proveedor (sin actualizar BD directamente, el processor lo hará)
  if (request.provider === 'haulmer') {
    return await emitHaulmerDocument(request, order, invoice, org);
  } else if (request.provider === 'stripe') {
    return await emitStripeDocument(request, order, invoice, org);
  } else {
    throw new Error(`Proveedor desconocido: ${request.provider}`);
  }
}

/**
 * Emite documento con Haulmer
 */
async function emitHaulmerDocument(
  request: DocumentRequest,
  order: any,
  invoice: any,
  org: any
): Promise<EmissionResult> {
  console.log('[emitHaulmerDocument] Emitiendo con Haulmer:', {
    requestId: request.id,
    documentType: request.document_type,
  });

  // Verificar que la organización tenga RUT
  if (!org.tax_id) {
    throw new Error('La organización debe tener RUT configurado para emitir factura electrónica');
  }

  // Preparar datos para Haulmer
  const orderData = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    organizationId: org.id,
    amount: invoice.total,
    currency: invoice.currency,
    productType: order.product_type,
    productData: order.product_data || { name: 'Servicio' },
    paymentProvider: 'transbank',
  };

  const orgData = {
    rut: org.tax_id,
    razonSocial: org.name,
    giro: 'SERVICIOS', // Por defecto, idealmente obtener de la BD
    direccion: org.address || 'Sin dirección',
    comuna: org.city || 'Santiago',
    email: org.email,
  };

  // Emitir factura/boleta (sin actualizar BD directamente)
  const haulmerResponse = await emitHaulmerInvoice(orderData, orgData, { updateDatabase: false });

  // emitHaulmerInvoice ya guarda los archivos y retorna las URLs en la respuesta extendida
  const pdfUrl = (haulmerResponse as any).pdfUrl || undefined;
  const xmlUrl = (haulmerResponse as any).xmlUrl || undefined;

  return {
    external_id: haulmerResponse.FOLIO?.toString() || haulmerResponse.TOKEN,
    pdf_url: pdfUrl,
    xml_url: xmlUrl,
    provider_response: {
      TOKEN: haulmerResponse.TOKEN,
      FOLIO: haulmerResponse.FOLIO,
      RESOLUCION: haulmerResponse.RESOLUCION,
      WARNING: haulmerResponse.WARNING,
    },
    provider_status: 'emitido',
  };
}

/**
 * Emite documento con Stripe
 */
async function emitStripeDocument(
  request: DocumentRequest,
  order: any,
  invoice: any,
  org: any
): Promise<EmissionResult> {
  console.log('[emitStripeDocument] Emitiendo con Stripe:', {
    requestId: request.id,
  });

  // Obtener o crear Stripe Customer ID
  const settings = org.settings as any;
  let stripeCustomerId = settings?.stripe_customer_id;

  if (!stripeCustomerId) {
    // Buscar customer existente o crear uno nuevo
    const { stripe } = await import('@/lib/stripe/client');
    const customers = await stripe.customers.list({
      limit: 1,
      email: org.email || org.name,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        name: org.name,
        email: org.email,
        metadata: {
          organization_id: org.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Guardar el customer ID en la organización
    await createServiceRoleClient()
      .from('organizations')
      .update({
        settings: {
          ...settings,
          stripe_customer_id: stripeCustomerId,
        },
      })
      .eq('id', org.id);
  }

  // Preparar datos para Stripe
  const orderData = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
    organizationId: org.id,
    stripeCustomerId,
    amount: invoice.total,
    currency: invoice.currency,
    productType: order.product_type,
    productData: order.product_data || { name: 'Servicio' },
  };

  // Crear invoice en Stripe (sin actualizar BD directamente)
  const stripeInvoice = await createStripeInvoiceForOrder(orderData, { updateDatabase: false });

  return {
    external_id: stripeInvoice.id,
    pdf_url: stripeInvoice.invoice_pdf || stripeInvoice.hosted_invoice_url || undefined,
    provider_response: {
      id: stripeInvoice.id,
      status: stripeInvoice.status,
      invoice_pdf: stripeInvoice.invoice_pdf,
      hosted_invoice_url: stripeInvoice.hosted_invoice_url,
    },
    provider_status: stripeInvoice.status,
  };
}

/**
 * Marca solicitud como completada
 */
async function markRequestAsCompleted(requestId: string, result: EmissionResult): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('complete_document_request', {
    p_request_id: requestId,
    p_external_id: result.external_id,
    p_pdf_url: result.pdf_url || null,
    p_xml_url: result.xml_url || null,
    p_provider_response: result.provider_response,
    p_provider_status: result.provider_status || null,
  });

  if (error) {
    throw new Error(`Error marcando solicitud como completada: ${error.message}`);
  }
}

/**
 * Marca solicitud como fallida
 */
async function markRequestAsFailed(requestId: string, errorMessage: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.rpc('fail_document_request', {
    p_request_id: requestId,
    p_error_message: errorMessage,
  });

  if (error) {
    console.error('[markRequestAsFailed] Error marcando solicitud como fallida:', {
      requestId,
      error: error.message,
    });
  }
}

