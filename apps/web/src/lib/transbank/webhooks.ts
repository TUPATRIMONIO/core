import { transbankClient } from './client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';
import { notifyCreditsAdded, notifyPaymentSucceeded, notifyPaymentFailed } from '@/lib/notifications/billing';
import { updateOrderStatus } from '../checkout/core';

/**
 * Helper para registrar eventos en el historial de la orden
 */
async function logOrderEvent(
  supabase: any,
  orderId: string,
  eventType: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.rpc('log_order_event', {
      p_order_id: orderId,
      p_event_type: eventType,
      p_description: description,
      p_metadata: metadata,
      p_user_id: null,
      p_from_status: null,
      p_to_status: null,
    });
  } catch (error: any) {
    // No fallar si el logging falla, solo loggear el error
    console.error('[logOrderEvent] Error registrando evento:', {
      orderId,
      eventType,
      error: error?.message,
    });
  }
}

/**
 * Maneja confirmación de pago Webpay Plus
 */
export async function handleTransbankWebhook(
  token: string,
  type: 'webpay_plus' | 'oneclick'
) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  try {
    let transactionData;
    
    if (type === 'webpay_plus') {
      // Confirmar transacción Webpay Plus
      transactionData = await transbankClient.commitWebpayPlusTransaction(token);
    } else {
      // Confirmar pago Oneclick
      transactionData = await transbankClient.commitOneclickPayment(token);
    }
    
    console.log('🔔 [Transbank Webhook] Transacción confirmada:', {
      token,
      type,
      status: transactionData.status || transactionData.response_code,
    });
    
    // Buscar pago en BD
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        invoice:invoices (
          id,
          organization_id,
          type,
          status
        )
      `)
      .eq('provider_payment_id', token)
      .eq('provider', 'transbank')
      .single();
    
    if (paymentError || !payment) {
      console.error('❌ Payment record not found for Transbank transaction:', {
        token,
        error: paymentError?.message,
      });
      return { success: false, error: 'Payment not found' };
    }
    
    console.log('✅ Payment encontrado:', {
      paymentId: payment.id,
      invoiceId: payment.invoice?.id,
      invoiceType: payment.invoice?.type,
    });
    
    // Verificar estado de la transacción
    const isSuccess = type === 'webpay_plus' 
      ? transactionData.status === 'AUTHORIZED' && transactionData.response_code === 0
      : transactionData.response_code === 0;
    
    if (!isSuccess) {
      // Pago fallido
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_reason: `Transbank response code: ${transactionData.response_code || 'unknown'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
      
      // El evento de pago fallido se registra automáticamente cuando el estado cambia
      // No necesitamos duplicar el evento aquí
      
      // Notificar fallo
      try {
        await notifyPaymentFailed(
          payment.invoice?.organization_id || '',
          payment.amount,
          payment.currency,
          payment.invoice?.id || '',
          `Transbank response code: ${transactionData.response_code || 'unknown'}`
        );
      } catch (notifError: any) {
        console.error('Error enviando notificación de pago fallido:', notifError);
      }
      
      return { success: false, error: 'Transaction failed' };
    }
    
    // Pago exitoso - actualizar estado
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          authorization_code: type === 'webpay_plus' 
            ? (transactionData as any).authorization_code
            : transactionData.authorization_code,
          transaction_date: type === 'webpay_plus'
            ? (transactionData as any).transaction_date
            : transactionData.transaction_date,
        },
      })
      .eq('id', payment.id);
    
    // Buscar orden asociada (si existe)
    let order = null;
    if (payment.invoice) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status')
        .eq('invoice_id', payment.invoice.id)
        .single();
      order = orderData;
    }
    
    // También buscar por order_id en metadata si existe y no se encontró orden
    if (!order && payment.metadata?.order_id) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', payment.metadata.order_id)
        .single();
      order = orderData;
    }
    
    // El evento de pago exitoso se registra automáticamente cuando el estado cambia a 'paid'
    // No necesitamos duplicar el evento aquí
    
    // Actualizar factura si existe
    if (payment.invoice) {
      await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.invoice.id);
      
      // Actualizar orden si existe
      if (order && order.status === 'pending_payment') {
        await updateOrderStatus(order.id, 'paid', {
          paymentId: payment.id,
          supabaseClient: supabase, // Pasar service role client para bypass RLS
        });
      }
    }
    
    // Si es compra de créditos, agregar créditos
    if (payment.metadata?.type === 'credit_purchase') {
      const creditsAmount = parseFloat(payment.metadata.credits_amount || '0');
      
      console.log('💰 Agregando créditos:', {
        orgId: payment.invoice?.organization_id,
        creditsAmount,
        type: payment.metadata.type,
      });
      
      if (creditsAmount > 0 && payment.invoice?.organization_id) {
        try {
          const transactionId = await addCredits(
            payment.invoice.organization_id,
            creditsAmount,
            'credit_purchase',
            {
              payment_id: payment.id,
              transbank_token: token,
              invoice_id: payment.invoice.id,
              order_id: order?.id || payment.metadata?.order_id,
            }
          );
          
          console.log('✅ Créditos agregados exitosamente:', {
            transactionId,
            creditsAmount,
            orgId: payment.invoice.organization_id,
          });
          
          // Actualizar orden a 'completed' cuando se procesa el producto
          // Solo si ya está en estado 'paid' (no saltar directamente desde 'pending_payment')
          if (order) {
            // Recargar el estado actual de la orden desde la BD para asegurar que esté actualizado
            const { data: currentOrder } = await supabase
              .from('orders')
              .select('id, status')
              .eq('id', order.id)
              .single();
            
            if (currentOrder && currentOrder.status === 'paid') {
              await updateOrderStatus(order.id, 'completed', {
                supabaseClient: supabase, // Pasar service role client para bypass RLS
              });
            }
          }
          
          // Notificar créditos agregados
          try {
            await notifyCreditsAdded(
              payment.invoice.organization_id,
              creditsAmount,
              'credit_purchase',
              payment.invoice.id
            );
          } catch (notifError: any) {
            console.error('Error enviando notificación de créditos agregados:', notifError);
          }
          
          // Notificar pago exitoso
          try {
            await notifyPaymentSucceeded(
              payment.invoice.organization_id,
              payment.amount,
              payment.currency,
              payment.invoice.id
            );
          } catch (notifError: any) {
            console.error('Error enviando notificación de pago exitoso:', notifError);
          }
        } catch (error: any) {
          console.error('❌ Error agregando créditos:', {
            error: error.message,
            orgId: payment.invoice?.organization_id,
            creditsAmount,
          });
        }
      }
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error procesando webhook de Transbank:', {
      error: error.message,
      token,
      type,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Maneja finalización de inscripción Oneclick
 */
export async function handleOneclickInscriptionFinish(token: string) {
  const supabase = createServiceRoleClient();
  
  try {
    // Finalizar inscripción en Transbank
    const inscriptionData = await transbankClient.finishOneclickInscription(token);
    
    console.log('✅ [Transbank Oneclick] Inscripción finalizada - Datos completos:', {
      token,
      fullResponse: inscriptionData,
    });
    
    console.log('✅ [Transbank Oneclick] Inscripción finalizada - Datos extraídos:', {
      token,
      tbkUser: inscriptionData.tbk_user,
      username: inscriptionData.username,
      authorizationCode: inscriptionData.authorization_code,
      card_type: inscriptionData.card_type,
      card_number: inscriptionData.card_number,
      response_code: inscriptionData.response_code,
    });
    
    // Guardar método de pago Oneclick en BD
    // Nota: Necesitarías obtener el organization_id desde algún lugar (session, token, etc.)
    // Por ahora solo retornamos los datos
    
    return {
      success: true,
      tbkUser: inscriptionData.tbk_user,
      username: inscriptionData.username,
      authorizationCode: inscriptionData.authorization_code,
      card_type: inscriptionData.card_type,
      card_number: inscriptionData.card_number,
    };
  } catch (error: any) {
    console.error('❌ Error finalizando inscripción Oneclick:', {
      error: error.message,
      errorStack: error.stack,
      token,
    });
    return { success: false, error: error.message };
  }
}

