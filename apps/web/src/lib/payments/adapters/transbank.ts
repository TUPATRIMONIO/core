import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSession,
  VerifyPaymentParams,
  PaymentVerification,
  WebhookResult,
} from './base';
import { createTransbankPaymentForOrder } from '@/lib/transbank/checkout';
import { handleTransbankWebhook } from '@/lib/transbank/webhooks';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/lib/checkout/core';

/**
 * Adaptador de Transbank para el sistema unificado de pagos
 */
export class TransbankAdapter implements PaymentProvider {
  name = 'transbank';

  /**
   * Crea una transacción Webpay Plus de Transbank para una orden
   */
  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSession> {
    const result = await createTransbankPaymentForOrder(params.orderId, params.returnUrl);
    
    if (!result.url || !result.token) {
      throw new Error('No se pudo crear la transacción de Transbank');
    }
    
    return {
      url: result.url,
      sessionId: result.token, // En Transbank, el token actúa como sessionId
      provider: 'transbank',
    };
  }

  /**
   * Verifica el estado de un pago de Transbank después de que el usuario regresa
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerification> {
    const supabase = await createClient();
    const { token, orderId, organizationId, type } = params;
    
    if (!token) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: 'token es requerido para Transbank',
      };
    }
    
    try {
      // Buscar pago en BD por token
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('provider_payment_id', token)
        .eq('provider', 'transbank')
        .maybeSingle();
      
      if (paymentError || !payment) {
        // Si no se encuentra por token, buscar por orderId
        const { data: orderPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('provider', 'transbank')
          .eq('metadata->>order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!orderPayment) {
          return {
            success: false,
            paymentId: '',
            status: 'pending',
            error: 'Pago no encontrado en la base de datos',
          };
        }
        
        // Si encontramos por orderId pero el pago está pendiente, procesar webhook
        if (orderPayment.status === 'pending') {
          const webhookType = type || orderPayment.metadata?.payment_method === 'oneclick' ? 'oneclick' : 'webpay_plus';
          const webhookResult = await handleTransbankWebhook(token, webhookType);
          
          if (webhookResult.success) {
            // Recargar datos del pago
            const { data: updatedPayment } = await supabase
              .from('payments')
              .select('*')
              .eq('id', orderPayment.id)
              .single();
            
            return {
              success: true,
              paymentId: updatedPayment?.id || orderPayment.id,
              status: updatedPayment?.status === 'succeeded' ? 'succeeded' : 'pending',
            };
          }
        }
        
        return {
          success: orderPayment.status === 'succeeded',
          paymentId: orderPayment.id,
          status: orderPayment.status === 'succeeded' ? 'succeeded' : orderPayment.status === 'failed' ? 'failed' : 'pending',
        };
      }
      
      // Si es OneClick y está autorizado según los metadatos, actualizar estado inmediatamente
      const isOneclickPayment = payment.metadata?.payment_method === 'oneclick';
      const isAuthorized = payment.metadata?.response_code === 0;
      
      if (isOneclickPayment && isAuthorized && payment.status === 'pending') {
        // Actualizar pago a succeeded
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
          .select('*')
          .single();
        
        if (!updateError && updatedPayment) {
          // Actualizar orden a 'paid'
          await updateOrderStatus(orderId, 'paid', {
            paymentId: updatedPayment.id,
          });
          
          return {
            success: true,
            paymentId: updatedPayment.id,
            status: 'succeeded',
          };
        }
      }
      
      // Si el pago está pendiente, procesar webhook para verificar estado
      if (payment.status === 'pending') {
        const webhookType = type || (isOneclickPayment ? 'oneclick' : 'webpay_plus');
        
        const webhookResult = await handleTransbankWebhook(token, webhookType);
        
        if (webhookResult.success) {
          // Recargar datos del pago
          const { data: updatedPayment } = await supabase
            .from('payments')
            .select('*')
            .eq('id', payment.id)
            .single();
          
          return {
            success: true,
            paymentId: updatedPayment?.id || payment.id,
            status: updatedPayment?.status === 'succeeded' ? 'succeeded' : 'pending',
          };
        } else {
          return {
            success: false,
            paymentId: payment.id,
            status: 'failed',
            error: webhookResult.error || 'Error procesando webhook',
          };
        }
      }
      
      // Pago ya procesado
      return {
        success: payment.status === 'succeeded',
        paymentId: payment.id,
        status: payment.status === 'succeeded' ? 'succeeded' : payment.status === 'failed' ? 'failed' : 'pending',
      };
    } catch (error: any) {
      console.error('[TransbankAdapter] Error verificando pago:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error.message || 'Error verificando pago con Transbank',
      };
    }
  }

  /**
   * Procesa un webhook de Transbank
   */
  async processWebhook(event: any): Promise<WebhookResult> {
    try {
      // Transbank webhook viene como { token, type }
      const { token, type } = event;
      
      if (!token || !type) {
        return {
          success: false,
          processed: false,
          error: 'token y type son requeridos para webhook de Transbank',
        };
      }
      
      const result = await handleTransbankWebhook(token, type);
      
      return {
        success: result.success,
        processed: result.success,
        error: result.error,
      };
    } catch (error: any) {
      console.error('[TransbankAdapter] Error procesando webhook:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Error procesando webhook de Transbank',
      };
    }
  }
}

