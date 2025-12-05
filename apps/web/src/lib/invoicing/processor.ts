/**
 * Processor para emisión de documentos tributarios externos
 * 
 * Este módulo procesa solicitudes de emisión de documentos y llama
 * a los proveedores correspondientes (Haulmer o Stripe).
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { DocumentType, EmissionResult, ProviderType, determineProviderByDocumentType } from './document-types';
import { emitHaulmerInvoice } from '@/lib/haulmer/sync';
import { createStripeInvoiceForOrder } from '@/lib/stripe/sync';

/**
 * Procesa una solicitud de emisión de documento
 * 
 * @param requestId - ID de la solicitud en invoicing.emission_requests
 * @returns true si la emisión fue exitosa
 */
export async function processEmissionRequest(requestId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  console.log('[processEmissionRequest] Iniciando procesamiento:', { requestId });

  try {
    // Obtener solicitud desde emission_requests
    const { data: request, error: requestError } = await supabase
      .from('emission_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !request) {
      console.error('[processEmissionRequest] Solicitud no encontrada:', {
        requestId,
        error: requestError?.message,
      });
      return false;
    }

    // Verificar que no esté ya procesada
    if (request.status === 'completed') {
      console.log('[processEmissionRequest] Solicitud ya completada:', { requestId });
      return true;
    }

    // Verificar intentos máximos
    if (request.attempts >= request.max_attempts) {
      console.error('[processEmissionRequest] Máximo de intentos alcanzado:', {
        requestId,
        attempts: request.attempts,
        max_attempts: request.max_attempts,
      });
      await markRequestAsFailed(requestId, 'Máximo de intentos alcanzado');
      return false;
    }

    // Extraer datos desde request_data JSONB
    const requestData = request.request_data || {};
    const orderId = requestData.order_id;
    const documentType = requestData.document_type as DocumentType;

    if (!orderId) {
      throw new Error('order_id no encontrado en request_data');
    }

    if (!documentType) {
      throw new Error('document_type no encontrado en request_data');
    }

    // Determinar proveedor según tipo de documento
    const provider = determineProviderByDocumentType(documentType);

    // Marcar como procesando usando RPC
    const { error: updateError } = await supabase.rpc('update_emission_request_status', {
      p_request_id: requestId,
      p_status: 'processing',
      p_attempts: request.attempts + 1,
      p_processed_at: new Date().toISOString(),
    });
    
    if (updateError) {
      console.error('[processEmissionRequest] Error marcando como processing:', updateError);
    }

    // Procesar según el proveedor
    const result = await emitDocument({
      requestId: request.id,
      orderId,
      organizationId: request.organization_id,
      documentType,
      provider,
    });

    if (result) {
      // Marcar como completada y crear documento
      await markRequestAsCompleted(requestId, result, orderId, documentType, provider);
      console.log('[processEmissionRequest] Documento emitido exitosamente:', {
        requestId,
        external_id: result.external_id,
      });
      return true;
    } else {
      throw new Error('Emisión falló sin error específico');
    }
  } catch (error: any) {
    console.error('[processEmissionRequest] Error procesando solicitud:', {
      requestId,
      error: error.message,
    });
    
    await markRequestAsFailed(requestId, error.message);
    return false;
  }
}

// Alias para compatibilidad con código existente
export const processDocumentRequest = processEmissionRequest;

/**
 * Emite el documento según el proveedor
 */
async function emitDocument(params: {
  requestId: string;
  orderId: string;
  organizationId: string;
  documentType: DocumentType;
  provider: ProviderType;
}): Promise<EmissionResult> {
  const supabase = createServiceRoleClient();

  console.log('[emitDocument] Emitiendo documento:', {
    requestId: params.requestId,
    provider: params.provider,
    documentType: params.documentType,
  });

  // Obtener datos de la orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .single();

  if (orderError || !order) {
    throw new Error(`Orden no encontrada: ${orderError?.message}`);
  }

  // Obtener datos de la organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.organizationId)
    .single();

  if (orgError || !org) {
    throw new Error(`Organización no encontrada: ${orgError?.message}`);
  }

  // Emitir según el proveedor
  if (params.provider === 'haulmer') {
    return await emitHaulmerDocument(params, order, org);
  } else if (params.provider === 'stripe') {
    return await emitStripeDocument(params, order, org);
  } else {
    throw new Error(`Proveedor desconocido: ${params.provider}`);
  }
}

/**
 * Emite documento con Haulmer
 */
async function emitHaulmerDocument(
  params: { requestId: string; documentType: DocumentType },
  order: any,
  org: any
): Promise<EmissionResult> {
  console.log('[emitHaulmerDocument] Emitiendo con Haulmer:', {
    requestId: params.requestId,
    documentType: params.documentType,
  });

  // Leer datos de facturación desde metadata de la orden
  const billingData = order.metadata?.billing_data || {};
  const orderMetadata = order.metadata || {};

  // Validar datos requeridos según tipo de documento
  if (!billingData.tax_id || !billingData.name) {
    throw new Error('Los datos de facturación son requeridos. Por favor completa RUT/Tax ID y Nombre/Razón Social.');
  }

  // Para facturas, validar campos adicionales
  if (params.documentType === 'factura_electronica') {
    if (!billingData.giro) {
      throw new Error('El giro es requerido para facturas electrónicas');
    }
    if (!billingData.address) {
      throw new Error('La dirección es requerida para facturas electrónicas');
    }
    if (!billingData.city) {
      throw new Error('La ciudad/comuna es requerida para facturas electrónicas');
    }
  }

  // Preparar datos para Haulmer usando datos de facturación de la orden
  const orderData = {
    orderId: order.id,
    orderNumber: order.order_number,
    organizationId: org.id,
    amount: order.amount,
    currency: order.currency,
    productType: order.product_type,
    productData: order.product_data || { name: 'Servicio' },
    paymentProvider: 'transbank',
  };

  // Usar datos de billing_data si están disponibles, sino usar datos de la organización como fallback
  const orgData = {
    rut: billingData.tax_id || org.tax_id,
    razonSocial: billingData.name || org.name,
    giro: billingData.giro || 'SERVICIOS',
    direccion: billingData.address || org.address || 'Sin dirección',
    comuna: billingData.city || org.city || 'Santiago',
    email: org.email,
  };

  // Emitir factura/boleta según tipo de documento (sin actualizar BD directamente)
  const haulmerDocType = params.documentType === 'boleta_electronica' ? 'boleta_electronica' : 'factura_electronica';
  const haulmerResponse = await emitHaulmerInvoice(orderData, orgData, { 
    updateDatabase: false,
    documentType: haulmerDocType,
  });

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
  params: { requestId: string; documentType: DocumentType },
  order: any,
  org: any
): Promise<EmissionResult> {
  console.log('[emitStripeDocument] Emitiendo con Stripe:', {
    requestId: params.requestId,
  });

  // Obtener datos de facturación del metadata de la orden (si están disponibles)
  const billingData = order.metadata?.billing_data || {};
  
  // Usar datos de facturación de la orden si están disponibles, sino usar datos de la organización
  const customerName = billingData.name || org.name;
  const customerEmail = billingData.email || org.email;
  const customerTaxId = billingData.tax_id || null;

  // Obtener o crear Stripe Customer ID
  const settings = org.settings as any;
  let stripeCustomerId = settings?.stripe_customer_id;

  const { stripe } = await import('@/lib/stripe/client');
  
  if (!stripeCustomerId) {
    // Buscar customer existente o crear uno nuevo
    const customers = await stripe.customers.list({
      limit: 1,
      email: customerEmail || customerName,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
      // Actualizar nombre si cambió
      await stripe.customers.update(stripeCustomerId, {
        name: customerName,
        metadata: {
          organization_id: org.id,
          ...(customerTaxId && { tax_id: customerTaxId }),
        },
      });
    } else {
      const customer = await stripe.customers.create({
        name: customerName,
        email: customerEmail,
        metadata: {
          organization_id: org.id,
          ...(customerTaxId && { tax_id: customerTaxId }),
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
  
  // Agregar Tax ID al customer de Stripe si existe y no lo tiene
  if (customerTaxId && stripeCustomerId) {
    try {
      // Verificar si ya tiene el tax ID
      const existingTaxIds = await stripe.customers.listTaxIds(stripeCustomerId);
      const hasThisTaxId = existingTaxIds.data.some(t => t.value === customerTaxId);
      
      if (!hasThisTaxId) {
        // Determinar tipo de tax ID según el país
        const country = (org as any).country || 'CL';
        const taxIdType = country === 'CL' ? 'cl_tin' : 'eu_vat'; // cl_tin para RUT chileno
        
        await stripe.customers.createTaxId(stripeCustomerId, {
          type: taxIdType as any,
          value: customerTaxId,
        });
        console.log('[emitStripeDocument] Tax ID agregado al customer:', customerTaxId);
      }
    } catch (taxError: any) {
      // No fallar si no se puede agregar el tax ID (puede ser formato inválido)
      console.warn('[emitStripeDocument] No se pudo agregar Tax ID:', taxError.message);
    }
  }

  // Preparar datos para Stripe usando datos de la orden
  const orderData = {
    orderId: order.id,
    orderNumber: order.order_number,
    organizationId: org.id,
    stripeCustomerId,
    amount: order.amount,
    currency: order.currency,
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
 * Marca solicitud como completada y crea el documento
 */
async function markRequestAsCompleted(
  requestId: string,
  result: EmissionResult,
  orderId: string,
  documentType: DocumentType,
  provider: ProviderType
): Promise<void> {
  const supabase = createServiceRoleClient();

  // Obtener datos de la solicitud
  const { data: request, error: requestError } = await supabase
    .from('emission_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    throw new Error(`Solicitud no encontrada: ${requestError?.message}`);
  }

  const requestData = request.request_data || {};
  const orderNumber = requestData.order_number;

  // Obtener datos de la orden para crear el documento
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) {
    throw new Error('Orden no encontrada para crear documento');
  }

  // Obtener datos de la organización (quien recibe el documento)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', request.organization_id)
    .single();

  if (orgError || !org) {
    throw new Error(`Organización no encontrada: ${orgError?.message}`);
  }

  // Obtener datos de facturación del metadata de la orden (si están disponibles)
  const billingData = order.metadata?.billing_data || {};
  
  // Usar datos de facturación de la orden si están disponibles, sino usar datos de la organización
  const customerName = billingData.name || org.name;
  const customerTaxId = billingData.tax_id || (org as any).tax_id || 'SIN-RUT';
  const customerEmail = billingData.email || (org as any).email || null;
  const customerType = customerTaxId && customerTaxId !== 'SIN-RUT' ? 'empresa' : 'persona_natural';
  const customerCountry = (org as any).country || 'CL';

  // Obtener o crear customer usando RPC
  const { data: customerId, error: customerError } = await supabase.rpc(
    'get_or_create_invoicing_customer',
    {
      p_organization_id: request.organization_id,
      p_name: customerName,
      p_tax_id: customerTaxId,
      p_email: customerEmail,
      p_customer_type: customerType,
      p_country: customerCountry,
    }
  );

  if (customerError) {
    console.error('[markRequestAsCompleted] Error en get_or_create_invoicing_customer:', customerError);
    throw new Error(`Error obteniendo/creando customer: ${customerError.message}`);
  }

  if (!customerId) {
    throw new Error('No se pudo obtener o crear customer (retornó null)');
  }

  // Generar número de documento usando RPC
  const { data: docNumber, error: docNumberError } = await supabase.rpc(
    'generate_invoicing_document_number',
    {
      p_document_type: documentType,
    }
  );

  if (docNumberError) {
    throw new Error(`Error generando número de documento: ${docNumberError.message}`);
  }

  // Crear documento usando RPC
  const { data: documentId, error: docError } = await supabase.rpc(
    'create_invoicing_document_from_request',
    {
      p_organization_id: request.organization_id,
      p_customer_id: customerId,
      p_order_id: orderId,
      p_emission_request_id: requestId,
      p_document_type: documentType,
      p_document_number: docNumber || `DOC-${Date.now()}`,
      p_status: 'issued',
      p_external_id: result.external_id,
      p_external_provider: provider,
      p_subtotal: order.amount || 0,
      p_tax_amount: 0,
      p_total: order.amount || 0,
      p_currency: order.currency || 'CLP',
      p_pdf_url: result.pdf_url || null,
      p_xml_url: result.xml_url || null,
      p_provider_response: result.provider_response || null,
    }
  );

  if (docError || !documentId) {
    throw new Error(`Error creando documento: ${docError?.message}`);
  }

  // Actualizar emission_request como completada usando RPC
  const { error: updateError } = await supabase.rpc('update_emission_request_status', {
    p_request_id: requestId,
    p_status: 'completed',
    p_completed_at: new Date().toISOString(),
  });

  if (updateError) {
    throw new Error(`Error actualizando solicitud: ${updateError.message}`);
  }

  console.log('[markRequestAsCompleted] Documento creado exitosamente:', {
    requestId,
    documentId,
    documentNumber: docNumber,
  });
}

/**
 * Marca solicitud como fallida
 */
async function markRequestAsFailed(requestId: string, errorMessage: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Obtener solicitud actual
  const { data: request } = await supabase
    .from('emission_requests')
    .select('attempts, max_attempts')
    .eq('id', requestId)
    .single();

  const attempts = (request?.attempts || 0) + 1;
  const maxAttempts = request?.max_attempts || 3;
  const newStatus = attempts >= maxAttempts ? 'failed' : 'pending';

  // Actualizar solicitud usando RPC
  const { error } = await supabase.rpc('update_emission_request_status', {
    p_request_id: requestId,
    p_status: newStatus,
    p_attempts: attempts,
    p_last_error: errorMessage,
  });

  if (error) {
    console.error('[markRequestAsFailed] Error marcando solicitud como fallida:', {
      requestId,
      error: error.message,
    });
  }
}

