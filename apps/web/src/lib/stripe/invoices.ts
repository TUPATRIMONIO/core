import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';

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
    // Retornar facturas de la BD si no hay customer en Stripe
    const { data: invoices } = await supabase
    .from('invoices')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return invoices || [];
  }
  
  // Obtener facturas de Stripe
  const stripeInvoices = await stripe.invoices.list({
    customer: subscription.stripe_customer_id,
    limit,
  });
  
  // Sincronizar con BD
  const invoices = [];
  for (const invoice of stripeInvoices.data) {
    const { data: dbInvoice } = await supabase
    .from('invoices')
      .select('*')
      .eq('provider_invoice_id', invoice.id)
      .single();
    
    if (!dbInvoice) {
      // Crear factura en BD con manejo de errores de duplicado
      const maxRetries = 5;
      let newInvoice = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const invoiceNumber = await generateInvoiceNumber();
          
          const result = await supabase
            .from('invoices')
            .insert({
              organization_id: orgId,
              invoice_number: invoiceNumber,
              status: mapStripeInvoiceStatus(invoice.status),
              type: invoice.subscription ? 'subscription' : 'one_time',
              subtotal: invoice.subtotal / 100,
              tax: invoice.tax / 100,
              total: invoice.total / 100,
              currency: invoice.currency.toUpperCase(),
              due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
              paid_at: invoice.status === 'paid' && invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                : null,
              provider_invoice_id: invoice.id,
              pdf_url: invoice.invoice_pdf || null,
            })
            .select()
            .single();
          
          if (!result.error) {
            newInvoice = result.data;
            break;
          }
          
          // Si es error de duplicado y no es el último intento, reintentar
          if (result.error.message.includes('duplicate key') && attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
            continue;
          }
          
          // Si no es error de duplicado o es el último intento, salir
          break;
        } catch (error: any) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
            continue;
          }
          console.error('Error creando factura desde Stripe:', error);
          break;
        }
      }
      
      if (newInvoice) {
        invoices.push(newInvoice);
      }
    } else {
      invoices.push(dbInvoice);
    }
  }
  
  return invoices;
}

/**
 * Obtiene una factura específica
 */
export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();
  
  // Buscar en BD primero
  const { data: invoice } = await supabase
      .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // Si tiene provider_invoice_id, obtener de Stripe también
  if (invoice.provider_invoice_id && invoice.provider_invoice_id.startsWith('in_')) {
    try {
      const stripeInvoice = await stripe.invoices.retrieve(invoice.provider_invoice_id);
      return {
        ...invoice,
        stripe_invoice: stripeInvoice,
      };
    } catch (error) {
      // Ignorar si no existe en Stripe
    }
  }
  
  return invoice;
}

/**
 * Descarga PDF de factura
 */
export async function downloadInvoicePDF(invoiceId: string) {
  const supabase = await createClient();
  
  const { data: invoice } = await supabase
      .from('invoices')
    .select('provider_invoice_id')
    .eq('id', invoiceId)
    .single();
  
  if (!invoice?.provider_invoice_id) {
    throw new Error('Invoice not found or no PDF available');
  }
  
  // Obtener PDF de Stripe
  const stripeInvoice = await stripe.invoices.retrieve(invoice.provider_invoice_id);
  
  if (!stripeInvoice.invoice_pdf) {
    throw new Error('PDF not available');
  }
  
  return stripeInvoice.invoice_pdf;
}

/**
 * Mapea el estado de factura de Stripe a nuestro enum
 */
function mapStripeInvoiceStatus(status: string | null): 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'open':
      return 'open';
    case 'paid':
      return 'paid';
    case 'void':
      return 'void';
    case 'uncollectible':
      return 'uncollectible';
    default:
      return 'open';
  }
}

/**
 * Genera número de factura único usando función thread-safe de la BD
 * Reintenta hasta 5 veces si hay errores
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.rpc('generate_invoice_number');
    
    if (!error && data) {
      return data;
    }
    
    // Si es el último intento, lanzar error
    if (attempt === maxAttempts - 1) {
      console.error('Error generando número de factura después de', maxAttempts, 'intentos:', error);
      throw new Error(`No se pudo generar número de factura: ${error?.message || 'Unknown error'}`);
    }
    
    // Esperar un poco antes de reintentar (exponencial backoff)
    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
  }
  
  throw new Error('No se pudo generar número de factura después de múltiples intentos');
}

