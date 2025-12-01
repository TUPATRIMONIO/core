/**
 * Emisor de documentos tributarios
 * Llama a los proveedores externos (Haulmer o Stripe) según el tipo de documento
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { DocumentType, ProviderType } from './types';
import { haulmerClient, TipoDTE, HaulmerReceptor, HaulmerDetalle, HaulmerTotales } from '@/lib/haulmer/client';
import { stripe } from '@/lib/stripe/client';

const IVA_RATE = 0.19; // 19% IVA Chile

/**
 * Emite un documento usando el proveedor correspondiente
 */
export async function emitDocument(
  documentId: string,
  documentType: DocumentType,
  provider: ProviderType,
  customer: any,
  items: any[],
  totals: { subtotal: number; tax: number; total: number },
  currency: string,
  options?: {
    sendEmail?: boolean;
    orderId?: string;
  }
): Promise<{
  external_id: string;
  pdf_url?: string;
  xml_url?: string;
  provider_response: Record<string, any>;
}> {
  if (provider === 'haulmer') {
    return await emitHaulmerDocument(documentId, documentType, customer, items, totals, currency, options);
  } else if (provider === 'stripe') {
    return await emitStripeDocument(documentId, customer, items, totals, currency, options);
  } else {
    throw new Error(`Proveedor desconocido: ${provider}`);
  }
}

/**
 * Emite documento con Haulmer
 */
async function emitHaulmerDocument(
  documentId: string,
  documentType: DocumentType,
  customer: any,
  items: any[],
  totals: { subtotal: number; tax: number; total: number },
  currency: string,
  options?: { sendEmail?: boolean }
): Promise<{
  external_id: string;
  pdf_url?: string;
  xml_url?: string;
  provider_response: Record<string, any>;
}> {
  if (!haulmerClient.isConfigured()) {
    throw new Error('Haulmer no está configurado. Revisar variables de entorno.');
  }

  // Determinar TipoDTE
  const tipoDTE = documentType === 'factura_electronica' 
    ? TipoDTE.FACTURA_ELECTRONICA 
    : TipoDTE.BOLETA_ELECTRONICA;

  // Limpiar RUT (quitar puntos, mantener guión)
  const cleanRut = customer.tax_id?.replace(/\./g, '') || '';

  // Construir receptor
  const receptor: HaulmerReceptor = {
    RUTRecep: cleanRut,
    RznSocRecep: customer.name,
    GiroRecep: customer.giro || 'SERVICIOS',
    DirRecep: customer.address || 'Sin dirección',
    CmnaRecep: customer.city || 'Santiago',
    CorreoRecep: customer.email,
  };

  // Construir detalle - los montos en detalle deben ser NETOS (sin IVA)
  // Si los items vienen con total bruto, calculamos el neto
  const detalle: HaulmerDetalle[] = items.map((item, index) => {
    // Calcular monto neto del item (sin IVA)
    const montoNeto = item.tax_exempt 
      ? Math.round(item.total) 
      : Math.round(item.total / (1 + IVA_RATE));
    
    const precioUnitarioNeto = item.tax_exempt
      ? Math.round(item.unit_price)
      : Math.round(item.unit_price / (1 + IVA_RATE));

    return {
      NroLinDet: index + 1,
      NmbItem: item.description,
      QtyItem: item.quantity || 1,
      PrcItem: precioUnitarioNeto,
      MontoItem: montoNeto,
      IndExe: item.tax_exempt ? 1 : undefined,
    };
  });

  // Construir totales - subtotal ya debería venir como monto neto
  const totales: HaulmerTotales = {
    MntNeto: Math.round(totals.subtotal),
    TasaIVA: '19',
    IVA: Math.round(totals.tax),
    MntTotal: Math.round(totals.total),
    MontoPeriodo: Math.round(totals.total),
    VlrPagar: Math.round(totals.total),
  };

  // Generar Idempotency Key
  const idempotencyKey = `doc-${documentId}-${Date.now()}`;

  console.log('[emitHaulmerDocument] Datos a enviar:', {
    tipoDTE,
    receptor,
    detalle,
    totales,
  });

  // Emitir documento
  const haulmerResponse = await haulmerClient.emitirDTE(
    tipoDTE,
    receptor,
    detalle,
    totales,
    {
      idempotencyKey,
      sendEmail: options?.sendEmail && customer.email ? { to: customer.email } : undefined,
    }
  );

  // Guardar PDF y XML en Storage
  const supabase = createServiceRoleClient();
  let pdfUrl: string | undefined;
  let xmlUrl: string | undefined;

  // Obtener organization_id del documento
  const { data: document } = await supabase
    .from('documents')
    .select('organization_id')
    .eq('id', documentId)
    .single();

  const organizationId = document?.organization_id;

  if (haulmerResponse.PDF && haulmerResponse.FOLIO && organizationId) {
    const pdfFileName = `haulmer/${organizationId}/${documentId}-${haulmerResponse.FOLIO}.pdf`;
    const buffer = Buffer.from(haulmerResponse.PDF, 'base64');
    
    const { error } = await supabase.storage
      .from('invoices')
      .upload(pdfFileName, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (!error) {
      const { data: publicUrl } = supabase.storage
        .from('invoices')
        .getPublicUrl(pdfFileName);
      pdfUrl = publicUrl.publicUrl;
    }
  }

  if (haulmerResponse.XML && haulmerResponse.FOLIO && organizationId) {
    const xmlFileName = `haulmer/${organizationId}/${documentId}-${haulmerResponse.FOLIO}.xml`;
    const buffer = Buffer.from(haulmerResponse.XML, 'base64');
    
    const { error } = await supabase.storage
      .from('invoices')
      .upload(xmlFileName, buffer, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (!error) {
      const { data: publicUrl } = supabase.storage
        .from('invoices')
        .getPublicUrl(xmlFileName);
      xmlUrl = publicUrl.publicUrl;
    }
  }

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
  };
}

/**
 * Emite documento con Stripe
 */
async function emitStripeDocument(
  documentId: string,
  customer: any,
  items: any[],
  totals: { subtotal: number; tax: number; total: number },
  currency: string,
  options?: { sendEmail?: boolean; orderId?: string }
): Promise<{
  external_id: string;
  pdf_url?: string;
  provider_response: Record<string, any>;
}> {
  const supabase = createServiceRoleClient();

  // Obtener organization_id del documento
  const { data: document } = await supabase
    .from('documents')
    .select('organization_id')
    .eq('id', documentId)
    .single();

  if (!document) {
    throw new Error('Documento no encontrado');
  }

  // Obtener o crear Stripe Customer
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, email, settings')
    .eq('id', document.organization_id)
    .single();

  if (!org) {
    throw new Error('Organización no encontrada');
  }

  const settings = org.settings as any;
  let stripeCustomerId = settings?.stripe_customer_id;

  if (!stripeCustomerId) {
    // Buscar customer existente o crear uno nuevo
    const customers = await stripe.customers.list({
      limit: 1,
      email: customer.email || org.email,
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        name: customer.name,
        email: customer.email,
        metadata: {
          organization_id: org.id,
          tax_id: customer.tax_id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Guardar customer ID en la organización
    await supabase
      .from('organizations')
      .update({
        settings: {
          ...settings,
          stripe_customer_id: stripeCustomerId,
        },
      })
      .eq('id', org.id);
  }

  // Crear invoice en Stripe
  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    currency: currency.toLowerCase(),
    collection_method: 'send_invoice',
    days_until_due: 0,
    metadata: {
      document_id: documentId,
      organization_id: org.id,
    },
  });

  // Agregar items
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: invoice.id,
      amount: Math.round(item.total * 100), // Stripe usa centavos
      currency: currency.toLowerCase(),
      description: item.description,
    });
  }

  // Marcar como pagado (out-of-band)
  const paidInvoice = await stripe.invoices.pay(invoice.id, {
    paid_out_of_band: true,
  });

  // Enviar invoice si se solicita
  if (options?.sendEmail) {
    try {
      await stripe.invoices.sendInvoice(paidInvoice.id);
    } catch (error) {
      // Es normal que falle si ya está pagado
      console.warn('[emitStripeDocument] No se pudo enviar invoice:', error);
    }
  }

  // Obtener invoice finalizado
  const finalInvoice = await stripe.invoices.retrieve(paidInvoice.id);

  return {
    external_id: finalInvoice.id,
    pdf_url: finalInvoice.invoice_pdf || finalInvoice.hosted_invoice_url || undefined,
    provider_response: {
      id: finalInvoice.id,
      status: finalInvoice.status,
      invoice_pdf: finalInvoice.invoice_pdf,
      hosted_invoice_url: finalInvoice.hosted_invoice_url,
    },
  };
}

