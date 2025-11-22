import { createServiceRoleClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';
import { verifyWebhookSignature } from './client';
import { notifyCreditsAdded, notifyPaymentSucceeded, notifyPaymentFailed } from '@/lib/notifications/billing';

export interface DLocalWebhookEvent {
  id: string;
  type: 'payment.created' | 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  payment: {
    id: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REJECTED' | 'FAILED';
    amount: number;
    currency: string;
    order_id?: string;
  };
  signature?: string;
}

/**
 * Maneja eventos de webhook de dLocal
 */
export async function handleDLocalWebhook(event: DLocalWebhookEvent) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  // Verificar firma si está presente
  if (event.signature) {
    const isValid = verifyWebhookSignature(event.signature, event.payment.id);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
  }
  
  switch (event.type) {
    case 'payment.created':
      await handlePaymentCreated(event.payment);
      break;
    
    case 'payment.completed':
      await handlePaymentCompleted(event.payment);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(event.payment);
      break;
    
    case 'payment.cancelled':
      await handlePaymentCancelled(event.payment);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Maneja creación de pago
 */
async function handlePaymentCreated(payment: DLocalWebhookEvent['payment']) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  // Buscar pago en BD (usar vista pública)
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'dlocal')
    .single();
  
  if (paymentRecord) {
    // Actualizar estado del pago (usar vista pública)
    await supabase
      .from('payments')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);
  }
}

/**
 * Maneja pago completado exitosamente
 */
async function handlePaymentCompleted(payment: DLocalWebhookEvent['payment']) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  // Buscar pago en BD (usar vista pública)
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices (
        id,
        organization_id,
        type,
        total,
        currency
      )
    `)
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'dlocal')
    .single();
  
  if (!paymentRecord) {
    console.error('Payment record not found for dLocal payment:', payment.id);
    return;
  }
  
  const orgId = paymentRecord.invoice?.organization_id;
  
  // Actualizar estado del pago (usar vista pública)
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentRecord.id);
  
  // Actualizar factura (usar vista pública)
  if (paymentRecord.invoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.invoice.id);
    
    // Notificar pago exitoso
    if (orgId) {
      try {
        await notifyPaymentSucceeded(
          orgId,
          paymentRecord.invoice.total || payment.amount,
          paymentRecord.invoice.currency || payment.currency,
          paymentRecord.invoice.id
        );
      } catch (notifError: any) {
        console.error('Error enviando notificación de pago exitoso dLocal:', notifError);
      }
    }
    
    // Si es compra de créditos, agregar créditos
    if (paymentRecord.invoice.type === 'credit_purchase' && orgId) {
      // Obtener información del paquete desde metadata o invoice line items (usar vista pública)
      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('description')
        .eq('invoice_id', paymentRecord.invoice.id)
        .limit(1)
        .single();
      
      // Extraer cantidad de créditos del description o metadata
      const creditsMatch = lineItems?.description?.match(/(\d+)\s*créditos/i);
      const creditsAmount = creditsMatch ? parseFloat(creditsMatch[1]) : 0;
      
      if (creditsAmount > 0) {
        try {
          await addCredits(
            orgId,
            creditsAmount,
            'credit_purchase',
            {
              payment_id: paymentRecord.id,
              dlocal_payment_id: payment.id,
              invoice_id: paymentRecord.invoice.id,
            }
          );
          
          // Notificar créditos agregados
          try {
            await notifyCreditsAdded(
              orgId,
              creditsAmount,
              'credit_purchase',
              paymentRecord.invoice.id
            );
          } catch (notifError: any) {
            console.error('Error enviando notificación de créditos agregados dLocal:', notifError);
          }
        } catch (error: any) {
          console.error('Error agregando créditos dLocal:', error);
        }
      }
    }
  }
}

/**
 * Maneja pago fallido
 */
async function handlePaymentFailed(payment: DLocalWebhookEvent['payment']) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  // Buscar pago en BD (usar vista pública)
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select(`
      *,
      invoice:invoices (
        id,
        organization_id,
        total,
        currency
      )
    `)
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'dlocal')
    .single();
  
  if (paymentRecord) {
    const orgId = paymentRecord.invoice?.organization_id;
    
    // Actualizar estado del pago (usar vista pública)
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);
    
    // Actualizar factura (usar vista pública)
    if (paymentRecord.invoice) {
      await supabase
        .from('invoices')
        .update({
          status: 'open', // Mantener como open para reintentar
        })
        .eq('id', paymentRecord.invoice.id);
      
      // Notificar fallo de pago
      if (orgId) {
        try {
          await notifyPaymentFailed(
            orgId,
            paymentRecord.invoice.total || payment.amount,
            paymentRecord.invoice.currency || payment.currency,
            paymentRecord.invoice.id,
            `Estado: ${payment.status}`
          );
        } catch (notifError: any) {
          console.error('Error enviando notificación de pago fallido dLocal:', notifError);
        }
      }
    }
  }
}

/**
 * Maneja pago cancelado
 */
async function handlePaymentCancelled(payment: DLocalWebhookEvent['payment']) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  // Buscar pago en BD (usar vista pública)
  const { data: paymentRecord } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_payment_id', payment.id)
    .eq('provider', 'dlocal')
    .single();
  
  if (paymentRecord) {
    // Actualizar estado del pago (usar vista pública)
    await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);
  }
}

