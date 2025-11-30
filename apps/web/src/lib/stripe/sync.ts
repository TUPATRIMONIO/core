import { stripe } from './client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * Sincroniza una factura de Stripe a nuestra base de datos
 * 
 * Stripe genera invoices automáticamente cuando se procesan pagos.
 * Esta función obtiene el invoice de Stripe y actualiza nuestra BD con la información.
 * 
 * @param paymentIntentId - ID del Payment Intent de Stripe
 * @param invoiceId - ID de la factura en nuestra BD
 * @returns Datos del invoice de Stripe sincronizado
 */
export async function syncStripeInvoice(
  paymentIntentId: string,
  invoiceId: string
): Promise<Stripe.Invoice | null> {
  const supabase = createServiceRoleClient();

  console.log('[syncStripeInvoice] Iniciando sincronización:', {
    paymentIntentId,
    invoiceId,
  });

  try {
    // Obtener Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    console.log('[syncStripeInvoice] Payment Intent obtenido:', {
      paymentIntentId,
      invoiceId: paymentIntent.invoice,
      status: paymentIntent.status,
    });

    // Si el Payment Intent tiene un invoice asociado, obtenerlo
    let stripeInvoice: Stripe.Invoice | null = null;

    if (paymentIntent.invoice) {
      const invoiceIdStr = typeof paymentIntent.invoice === 'string'
        ? paymentIntent.invoice
        : paymentIntent.invoice.id;

      stripeInvoice = await stripe.invoices.retrieve(invoiceIdStr);

      console.log('[syncStripeInvoice] Invoice obtenido de Stripe:', {
        invoiceId: stripeInvoice.id,
        status: stripeInvoice.status,
        pdfUrl: stripeInvoice.invoice_pdf,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
      });

      // Actualizar factura en nuestra BD con datos externos
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
        console.error('[syncStripeInvoice] Error actualizando factura:', {
          invoiceId,
          error: updateError?.message,
        });
        throw new Error(`Error sincronizando factura: ${updateError?.message || 'Unknown error'}`);
      }

      console.log('[syncStripeInvoice] Factura sincronizada exitosamente:', {
        invoiceId,
        stripeInvoiceId: stripeInvoice.id,
        external_provider: updatedInvoice.external_provider,
      });
    } else {
      console.warn('[syncStripeInvoice] Payment Intent no tiene invoice asociado:', {
        paymentIntentId,
        invoiceId,
      });
    }

    return stripeInvoice;
  } catch (error: any) {
    console.error('[syncStripeInvoice] Error en sincronización:', {
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

