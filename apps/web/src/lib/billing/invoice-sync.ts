import { syncStripeInvoice } from '@/lib/stripe/sync';
import { syncHaulmerInvoice } from '@/lib/haulmer/sync';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Orquesta la sincronización de facturas externas según el proveedor detectado
 * 
 * Esta función detecta qué proveedor de pago se usó (Stripe o Transbank) y
 * llama a la función de sincronización correspondiente.
 * 
 * @param orderId - ID de la orden que cambió a estado "completed"
 * @returns true si la sincronización fue exitosa
 */
export async function syncExternalInvoice(orderId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  console.log('[syncExternalInvoice] Iniciando sincronización para orden:', {
    orderId,
  });

  try {
    // Obtener orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, invoice_id, payment_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[syncExternalInvoice] Error obteniendo orden:', {
        orderId,
        error: orderError?.message,
      });
      return false;
    }

    // Verificar que la orden tenga invoice y payment
    if (!order.invoice_id || !order.payment_id) {
      console.warn('[syncExternalInvoice] Orden sin invoice o payment:', {
        orderId,
        hasInvoice: !!order.invoice_id,
        hasPayment: !!order.payment_id,
      });
      return false;
    }

    // Obtener payment por separado
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, provider, provider_payment_id, metadata')
      .eq('id', order.payment_id)
      .single();

    if (paymentError || !payment) {
      console.warn('[syncExternalInvoice] Payment no encontrado:', {
        orderId,
        paymentId: order.payment_id,
        error: paymentError?.message,
      });
      return false;
    }

    // Obtener invoice por separado
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, external_provider, external_document_id')
      .eq('id', order.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      console.warn('[syncExternalInvoice] Invoice no encontrado:', {
        orderId,
        invoiceId: order.invoice_id,
        error: invoiceError?.message,
      });
      return false;
    }

    // Verificar si ya está sincronizada
    if (invoice.external_provider && invoice.external_document_id) {
      console.log('[syncExternalInvoice] Factura ya sincronizada:', {
        orderId,
        invoiceId: invoice.id,
        external_provider: invoice.external_provider,
        external_document_id: invoice.external_document_id,
      });
      return true;
    }

    // Detectar proveedor y sincronizar
    const provider = payment.provider; // 'stripe' o 'transbank'

    if (provider === 'stripe') {
      // Sincronizar factura de Stripe
      const paymentIntentId = payment.provider_payment_id;
      
      if (!paymentIntentId) {
        console.error('[syncExternalInvoice] Payment Intent ID no encontrado:', {
          orderId,
          paymentId: payment.id,
        });
        return false;
      }

      await syncStripeInvoice(paymentIntentId, invoice.id);
      console.log('[syncExternalInvoice] Factura de Stripe sincronizada:', {
        orderId,
        invoiceId: invoice.id,
      });
      return true;
    } else if (provider === 'transbank') {
      // Sincronizar factura de Haulmer
      const transactionToken = payment.provider_payment_id;
      
      if (!transactionToken) {
        console.error('[syncExternalInvoice] Transaction token no encontrado:', {
          orderId,
          paymentId: payment.id,
        });
        return false;
      }

      await syncHaulmerInvoice(transactionToken, invoice.id);
      console.log('[syncExternalInvoice] Factura de Haulmer sincronizada:', {
        orderId,
        invoiceId: invoice.id,
      });
      return true;
    } else {
      console.warn('[syncExternalInvoice] Proveedor desconocido:', {
        orderId,
        provider,
      });
      return false;
    }
  } catch (error: any) {
    console.error('[syncExternalInvoice] Error en sincronización:', {
      orderId,
      error: error.message,
    });
    return false;
  }
}

