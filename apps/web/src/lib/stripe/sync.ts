import { stripe } from './client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Interfaz para datos de la orden necesarios para crear invoice
 */
interface OrderDataForStripeInvoice {
  invoiceId: string;
  invoiceNumber: string;
  organizationId: string;
  stripeCustomerId: string;
  amount: number;
  currency: string;
  productType: string;
  productData: {
    name: string;
    description?: string;
    credits_amount?: number;
  };
}

/**
 * Crea un Invoice en Stripe para una orden ya pagada
 * 
 * Flujo: Crear Invoice → Agregar Items → Marcar como pagado (out-of-band) → Enviar
 * 
 * Esto es útil cuando el pago se realizó con otro método (ej: Transbank) pero
 * queremos generar un Invoice de Stripe para documentación.
 * 
 * @param orderData - Datos de la orden
 * @param options - Opciones adicionales
 * @param options.updateDatabase - Si true, actualiza la BD directamente (default: true para compatibilidad)
 * @returns Invoice de Stripe creado
 */
export async function createStripeInvoiceForOrder(
  orderData: OrderDataForStripeInvoice,
  options?: { updateDatabase?: boolean }
): Promise<Stripe.Invoice> {
  const supabase = createServiceRoleClient();
  const shouldUpdateDB = options?.updateDatabase !== false; // Default: true para compatibilidad

  console.log('[createStripeInvoiceForOrder] Creando invoice en Stripe:', {
    invoiceId: orderData.invoiceId,
    stripeCustomerId: orderData.stripeCustomerId,
    amount: orderData.amount,
    currency: orderData.currency,
    updateDatabase: shouldUpdateDB,
  });

  try {
    // 1. Crear Invoice en Stripe (como módulo 593 de Make)
    const invoice = await stripe.invoices.create({
      customer: orderData.stripeCustomerId,
      currency: orderData.currency.toLowerCase(),
      collection_method: 'send_invoice',
      days_until_due: 0,
      metadata: {
        internal_invoice_id: orderData.invoiceId,
        internal_invoice_number: orderData.invoiceNumber,
        organization_id: orderData.organizationId,
        product_type: orderData.productType,
      },
    });

    console.log('[createStripeInvoiceForOrder] Invoice creado:', {
      stripeInvoiceId: invoice.id,
      status: invoice.status,
    });

    // 2. Agregar Invoice Item (como módulo 589 de Make)
    const description = `Pedido ${orderData.invoiceNumber}: ${orderData.productData.name}`;
    
    await stripe.invoiceItems.create({
      customer: orderData.stripeCustomerId,
      invoice: invoice.id,
      amount: Math.round(orderData.amount * 100), // Stripe usa centavos
      currency: orderData.currency.toLowerCase(),
      description,
    });

    console.log('[createStripeInvoiceForOrder] Invoice Item agregado:', {
      stripeInvoiceId: invoice.id,
      description,
      amount: orderData.amount,
    });

    // 3. Marcar como pagado fuera de Stripe (como módulo 597 de Make)
    // paid_out_of_band: true indica que el pago se realizó externamente
    const paidInvoice = await stripe.invoices.pay(invoice.id, {
      paid_out_of_band: true,
    });

    console.log('[createStripeInvoiceForOrder] Invoice marcado como pagado:', {
      stripeInvoiceId: paidInvoice.id,
      status: paidInvoice.status,
    });

    // 4. Enviar el invoice (como módulo 598 de Make)
    // Nota: Si el invoice ya está pagado, sendInvoice puede fallar
    // Intentamos enviar pero no fallamos si hay error
    try {
      await stripe.invoices.sendInvoice(paidInvoice.id);
      console.log('[createStripeInvoiceForOrder] Invoice enviado');
    } catch (sendError: any) {
      // Es normal que falle si ya está pagado
      console.warn('[createStripeInvoiceForOrder] No se pudo enviar invoice (puede ser normal):', {
        error: sendError.message,
      });
    }

    // 5. Obtener invoice actualizado con PDF URL
    const finalInvoice = await stripe.invoices.retrieve(paidInvoice.id);

    // 6. Actualizar factura en nuestra BD con datos externos (solo si se solicita)
    if (shouldUpdateDB) {
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          external_provider: 'stripe',
          external_document_id: finalInvoice.id,
          external_pdf_url: finalInvoice.invoice_pdf || finalInvoice.hosted_invoice_url || null,
          external_status: finalInvoice.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderData.invoiceId)
        .select()
        .single();

      if (updateError) {
        console.error('[createStripeInvoiceForOrder] Error actualizando BD:', {
          invoiceId: orderData.invoiceId,
          error: updateError.message,
        });
        // No lanzar error - el invoice ya se creó en Stripe
      }
    }

    console.log('[createStripeInvoiceForOrder] Invoice creado exitosamente:', {
      invoiceId: orderData.invoiceId,
      stripeInvoiceId: finalInvoice.id,
      pdfUrl: finalInvoice.invoice_pdf,
      status: finalInvoice.status,
      updatedDatabase: shouldUpdateDB,
    });

    return finalInvoice;
  } catch (error: any) {
    console.error('[createStripeInvoiceForOrder] Error creando invoice:', {
      invoiceId: orderData.invoiceId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Sincroniza una factura de Stripe a nuestra base de datos
 * 
 * Esta función crea un nuevo Invoice en Stripe cuando la orden se completa.
 * 
 * @param paymentIntentId - ID del Payment Intent de Stripe
 * @param invoiceId - ID de la factura en nuestra BD
 * @returns Datos del invoice de Stripe creado
 */
export async function syncStripeInvoice(
  paymentIntentId: string,
  invoiceId: string
): Promise<Stripe.Invoice | null> {
  const supabase = createServiceRoleClient();

  console.log('[syncStripeInvoice] Iniciando creación de invoice:', {
    paymentIntentId,
    invoiceId,
  });

  try {
    // Obtener datos de la factura y orden
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        organization_id,
        total,
        currency,
        type,
        external_provider,
        external_document_id
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Factura no encontrada: ${invoiceError?.message}`);
    }

    // Verificar si ya está sincronizada
    if (invoice.external_provider && invoice.external_document_id) {
      console.log('[syncStripeInvoice] Factura ya sincronizada:', {
        invoiceId,
        external_provider: invoice.external_provider,
        external_document_id: invoice.external_document_id,
      });
      // Retornar el invoice existente
      return await stripe.invoices.retrieve(invoice.external_document_id);
    }

    // Obtener orden asociada
    const { data: order } = await supabase
      .from('orders')
      .select('product_type, product_data')
      .eq('invoice_id', invoiceId)
      .single();

    // Obtener Stripe Customer ID de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', invoice.organization_id)
      .single();

    if (!org) {
      throw new Error('Organización no encontrada');
    }

    // Obtener o crear Stripe Customer
    const settings = org.settings as any;
    let stripeCustomerId = settings?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Buscar customer existente o crear uno nuevo
      const customers = await stripe.customers.list({
        limit: 1,
        email: org.name, // O buscar por otro campo
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        // Crear customer si no existe
        const customer = await stripe.customers.create({
          name: org.name,
          metadata: {
            organization_id: org.id,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Guardar el customer ID en la organización
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

    // Preparar datos para crear invoice
    const orderData: OrderDataForStripeInvoice = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      organizationId: invoice.organization_id,
      stripeCustomerId,
      amount: invoice.total,
      currency: invoice.currency,
      productType: order?.product_type || invoice.type,
      productData: order?.product_data || { name: 'Servicio' },
    };

    // Crear invoice en Stripe
    return await createStripeInvoiceForOrder(orderData);
  } catch (error: any) {
    console.error('[syncStripeInvoice] Error:', {
      paymentIntentId,
      invoiceId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Sincroniza una factura de Stripe usando el ID del invoice directamente
 * 
 * @param stripeInvoiceId - ID del invoice en Stripe
 * @param invoiceId - ID de la factura en nuestra BD
 * @returns Datos del invoice de Stripe sincronizado
 */
export async function syncStripeInvoiceById(
  stripeInvoiceId: string,
  invoiceId: string
): Promise<Stripe.Invoice> {
  const supabase = createServiceRoleClient();

  console.log('[syncStripeInvoiceById] Iniciando sincronización:', {
    stripeInvoiceId,
    invoiceId,
  });

  try {
    // Obtener invoice de Stripe por ID
    const stripeInvoice = await stripe.invoices.retrieve(stripeInvoiceId);

    console.log('[syncStripeInvoiceById] Invoice obtenido de Stripe:', {
      invoiceId: stripeInvoice.id,
      status: stripeInvoice.status,
      pdfUrl: stripeInvoice.invoice_pdf,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
    });

    // Actualizar factura en nuestra BD
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        external_provider: 'stripe',
        external_document_id: stripeInvoice.id,
        external_pdf_url: stripeInvoice.invoice_pdf || stripeInvoice.hosted_invoice_url || null,
        external_status: stripeInvoice.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError || !updatedInvoice) {
      console.error('[syncStripeInvoiceById] Error actualizando factura:', {
        invoiceId,
        error: updateError?.message,
      });
      throw new Error(`Error sincronizando factura: ${updateError?.message || 'Unknown error'}`);
    }

    console.log('[syncStripeInvoiceById] Factura sincronizada exitosamente:', {
      invoiceId,
      stripeInvoiceId: stripeInvoice.id,
    });

    return stripeInvoice;
  } catch (error: any) {
    console.error('[syncStripeInvoiceById] Error en sincronización:', {
      stripeInvoiceId,
      invoiceId,
      error: error.message,
    });
    throw error;
  }
}

