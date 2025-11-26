import { createServiceRoleClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';
import { notifyCreditsAdded, notifyPaymentSucceeded, notifyPaymentFailed } from '@/lib/notifications/billing';

export interface DLocalWebhookEvent {
  id?: string;
  type?: string;
  payment?: {
    id: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REJECTED' | 'FAILED';
    amount: number;
    currency: string;
    order_id?: string;
  };
}

/**
 * Maneja eventos de webhook de dLocal Go
 * Documentación: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/notifications
 * 
 * Nota: dLocal Go envía notificaciones POST directamente al notification_url especificado.
 * El formato puede variar, por lo que este handler es flexible para manejar diferentes estructuras.
 */
export async function handleDLocalWebhook(event: DLocalWebhookEvent | any) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  console.log('🔔 Webhook dLocal Go recibido:', JSON.stringify(event, null, 2));
  
  // dLocal Go puede enviar el pago directamente o dentro de un objeto 'payment'
  // Manejar ambos casos
  const paymentData = event.payment || event;
  const paymentId = paymentData.id || event.id;
  const status = paymentData.status || event.status;
  
  if (!paymentId) {
    console.error('❌ Webhook dLocal Go sin payment ID:', event);
    throw new Error('Payment ID is required');
  }
  
  // Determinar tipo de evento basándose en el status
  // dLocal Go usa status directamente en lugar de tipos de evento separados
  if (status === 'PAID') {
    await handlePaymentCompleted(paymentData);
  } else if (status === 'FAILED' || status === 'REJECTED') {
    await handlePaymentFailed(paymentData);
  } else if (status === 'CANCELLED') {
    await handlePaymentCancelled(paymentData);
  } else if (status === 'PENDING') {
    await handlePaymentCreated(paymentData);
  } else {
    console.log(`ℹ️  Status no manejado: ${status}`);
  }
}

/**
 * Maneja creación de pago (status: PENDING)
 */
async function handlePaymentCreated(payment: any) {
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
 * Maneja pago completado exitosamente (status: PAID)
 */
async function handlePaymentCompleted(payment: any) {
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
 * Maneja pago fallido (status: FAILED o REJECTED)
 */
async function handlePaymentFailed(payment: any) {
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
 * Maneja pago cancelado (status: CANCELLED)
 */
async function handlePaymentCancelled(payment: any) {
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

