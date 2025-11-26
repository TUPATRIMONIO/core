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
  
  console.log('🔔 [dLocal Webhook] Evento recibido:', {
    timestamp: new Date().toISOString(),
    eventType: event.type || 'unknown',
    rawEvent: JSON.stringify(event, null, 2)
  });
  
  // dLocal Go puede enviar el pago directamente o dentro de un objeto 'payment'
  // Manejar ambos casos
  const paymentData = event.payment || event;
  const paymentId = paymentData.id || event.id;
  const status = paymentData.status || event.status;
  const orderId = paymentData.order_id || event.order_id;
  
  console.log('🔔 [dLocal Webhook] Datos extraídos:', {
    paymentId,
    status,
    orderId,
    amount: paymentData.amount || event.amount,
    currency: paymentData.currency || event.currency
  });
  
  if (!paymentId) {
    console.error('❌ [dLocal Webhook] Error: Payment ID no encontrado en el evento:', event);
    throw new Error('Payment ID is required');
  }
  
  // Determinar tipo de evento basándose en el status
  // dLocal Go usa status directamente en lugar de tipos de evento separados
  console.log(`🔔 [dLocal Webhook] Procesando evento con status: ${status}`);
  
  if (status === 'PAID') {
    console.log('✅ [dLocal Webhook] Procesando pago completado (PAID)');
    await handlePaymentCompleted(paymentData);
  } else if (status === 'FAILED' || status === 'REJECTED') {
    console.log('❌ [dLocal Webhook] Procesando pago fallido:', status);
    await handlePaymentFailed(paymentData);
  } else if (status === 'CANCELLED') {
    console.log('⚠️  [dLocal Webhook] Procesando pago cancelado');
    await handlePaymentCancelled(paymentData);
  } else if (status === 'PENDING') {
    console.log('⏳ [dLocal Webhook] Procesando pago pendiente');
    await handlePaymentCreated(paymentData);
  } else {
    console.log(`ℹ️  [dLocal Webhook] Status no manejado: ${status}`);
  }
  
  console.log('✅ [dLocal Webhook] Evento procesado exitosamente');
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
  
  console.log('💰 [dLocal Webhook] Buscando pago en BD:', {
    providerPaymentId: payment.id,
    orderId: payment.order_id,
    amount: payment.amount,
    currency: payment.currency
  });
  
  // Buscar pago en BD (usar vista pública)
  const { data: paymentRecord, error: searchError } = await supabase
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
  
  if (searchError) {
    console.error('❌ [dLocal Webhook] Error buscando pago en BD:', {
      error: searchError,
      providerPaymentId: payment.id
    });
  }
  
  if (!paymentRecord) {
    console.error('❌ [dLocal Webhook] Payment record not found for dLocal payment:', {
      providerPaymentId: payment.id,
      orderId: payment.order_id
    });
    return;
  }
  
  console.log('✅ [dLocal Webhook] Pago encontrado en BD:', {
    paymentId: paymentRecord.id,
    currentStatus: paymentRecord.status,
    invoiceId: paymentRecord.invoice?.id,
    invoiceType: paymentRecord.invoice?.type,
    orgId: paymentRecord.invoice?.organization_id
  });
  
  const orgId = paymentRecord.invoice?.organization_id;
  
  if (!orgId) {
    console.error('❌ [dLocal Webhook] No se encontró organization_id para el pago:', paymentRecord.id);
    return;
  }
  
  // Actualizar estado del pago (usar vista pública)
  const { error: updatePaymentError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentRecord.id);
  
  if (updatePaymentError) {
    console.error('❌ [dLocal Webhook] Error actualizando estado del pago:', updatePaymentError);
  } else {
    console.log('✅ [dLocal Webhook] Estado del pago actualizado a succeeded');
  }
  
  // Actualizar factura (usar vista pública)
  if (paymentRecord.invoice) {
    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.invoice.id);
    
    if (updateInvoiceError) {
      console.error('❌ [dLocal Webhook] Error actualizando factura:', updateInvoiceError);
    } else {
      console.log('✅ [dLocal Webhook] Factura actualizada a paid');
    }
    
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
      // Primero intentar obtener desde metadata del pago
      let creditsAmount = 0;
      
      if (paymentRecord.metadata?.credits_amount) {
        creditsAmount = parseFloat(paymentRecord.metadata.credits_amount.toString());
      } else {
        // Si no está en metadata, buscar en invoice line items
        const { data: lineItems } = await supabase
          .from('invoice_line_items')
          .select('description')
          .eq('invoice_id', paymentRecord.invoice.id)
          .limit(1)
          .maybeSingle(); // Usar maybeSingle() para evitar errores
        
        // Extraer cantidad de créditos del description
        if (lineItems?.description) {
          const creditsMatch = lineItems.description.match(/(\d+)\s*créditos/i);
          creditsAmount = creditsMatch ? parseFloat(creditsMatch[1]) : 0;
        }
      }
      
      console.log('💰 [dLocal Webhook] Procesando créditos:', {
        creditsAmount,
        orgId,
        invoiceId: paymentRecord.invoice.id
      });
      
      if (creditsAmount > 0) {
        try {
          console.log(`💰 [dLocal Webhook] Agregando ${creditsAmount} créditos a la organización ${orgId}`);
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
          
          console.log('✅ [dLocal Webhook] Créditos agregados exitosamente');
          
          // Notificar créditos agregados
          try {
            await notifyCreditsAdded(
              orgId,
              creditsAmount,
              'credit_purchase',
              paymentRecord.invoice.id
            );
            console.log('✅ [dLocal Webhook] Notificación de créditos enviada');
          } catch (notifError: any) {
            console.error('❌ [dLocal Webhook] Error enviando notificación de créditos agregados:', notifError);
          }
        } catch (error: any) {
          console.error('❌ [dLocal Webhook] Error agregando créditos:', {
            error: error.message,
            stack: error.stack,
            creditsAmount,
            orgId
          });
        }
      } else {
        console.warn('⚠️  [dLocal Webhook] No se pudo determinar la cantidad de créditos para el pago:', {
          paymentId: payment.id,
          orderId: payment.order_id,
          metadata: paymentRecord.metadata
        });
      }
    } else {
      console.log('ℹ️  [dLocal Webhook] No es compra de créditos, saltando procesamiento de créditos');
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

