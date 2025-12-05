import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';
import { convertAmountFromStripe } from './checkout';

/**
 * Lista facturas de una organización
 */
export async function listInvoices(orgId: string, limit = 10) {
  const supabase = await createClient();
  
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!subscription?.stripe_customer_id) {
    // Retornar documentos tributarios de la BD si no hay customer en Stripe
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', orgId)
      .eq('provider', 'stripe')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return documents || [];
  }
  
  // Obtener facturas de Stripe
  const stripeInvoices = await stripe.invoices.list({
    customer: subscription.stripe_customer_id,
    limit,
  });
  
  // Sincronizar con BD (guardar en invoicing.documents)
  const invoices = [];
  for (const invoice of stripeInvoices.data) {
    // Buscar documento existente en invoicing.documents
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', orgId)
      .eq('provider', 'stripe')
      .eq('external_id', invoice.id)
      .maybeSingle();
    
    if (existingDoc) {
      invoices.push(existingDoc);
    } else {
      // Crear documento tributario en invoicing.documents
      // Nota: Para suscripciones, necesitamos un customer_id
      // Por ahora, creamos el documento sin customer (se puede actualizar después)
      try {
        const { data: newDoc, error: docError } = await supabase
          .from('documents')
          .insert({
            organization_id: orgId,
            customer_id: subscription.stripe_customer_id || null, // Temporal, debería ser customer_id real
            document_number: `STRIPE-${invoice.id.substring(0, 20)}`, // Número temporal
            document_type: 'stripe_invoice',
            provider: 'stripe',
            status: mapStripeInvoiceStatusToDocument(invoice.status),
            subtotal: convertAmountFromStripe(invoice.subtotal, invoice.currency),
            tax: convertAmountFromStripe(invoice.tax, invoice.currency),
            total: convertAmountFromStripe(invoice.total, invoice.currency),
            currency: invoice.currency.toUpperCase(),
            external_id: invoice.id,
            pdf_url: invoice.invoice_pdf || null,
            issued_at: invoice.status_transitions?.paid_at 
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
              : invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
            provider_response: invoice as any,
          })
          .select()
          .single();
        
        if (!docError && newDoc) {
          invoices.push(newDoc);
        }
      } catch (error: any) {
        console.error('Error creando documento desde Stripe invoice:', error);
        // Continuar con el siguiente invoice
      }
    }
  }
  
  return invoices;
}

/**
 * Obtiene una factura específica (documento tributario)
 */
export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();
  
  // Buscar en invoicing.documents primero
  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', invoiceId)
    .single();
  
  if (document) {
    // Si es de Stripe y tiene external_id, obtener también de Stripe
    if (document.provider === 'stripe' && document.external_id) {
      try {
        const stripeInvoice = await stripe.invoices.retrieve(document.external_id);
        return {
          ...document,
          stripe_invoice: stripeInvoice,
        };
      } catch (error) {
        // Ignorar si no existe en Stripe
      }
    }
    return document;
  }
  
  throw new Error('Invoice not found');
}

/**
 * Descarga PDF de factura
 */
export async function downloadInvoicePDF(invoiceId: string) {
  const supabase = await createClient();
  
  // Buscar documento en invoicing.documents
  const { data: document } = await supabase
    .from('documents')
    .select('external_id, pdf_url, provider')
    .eq('id', invoiceId)
    .single();
  
  if (!document) {
    throw new Error('Invoice not found');
  }
  
  // Si tiene PDF URL guardado, retornarlo
  if (document.pdf_url) {
    return document.pdf_url;
  }
  
  // Si es de Stripe y tiene external_id, obtener PDF de Stripe
  if (document.provider === 'stripe' && document.external_id) {
    const stripeInvoice = await stripe.invoices.retrieve(document.external_id);
    
    if (!stripeInvoice.invoice_pdf) {
      throw new Error('PDF not available');
    }
    
    return stripeInvoice.invoice_pdf;
  }
  
  throw new Error('PDF not available');
}

/**
 * Mapea el estado de factura de Stripe a nuestro enum de documentos
 */
function mapStripeInvoiceStatusToDocument(status: string | null): 'pending' | 'processing' | 'issued' | 'failed' | 'voided' {
  switch (status) {
    case 'paid':
      return 'issued';
    case 'open':
    case 'draft':
      return 'pending';
    case 'void':
      return 'voided';
    case 'uncollectible':
      return 'failed';
    default:
      return 'pending';
  }
}


