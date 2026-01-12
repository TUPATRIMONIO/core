import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSession,
  VerifyPaymentParams,
  PaymentVerification,
  WebhookResult,
} from './base';
import { stripe } from '@/lib/stripe/client';
import { createPaymentIntentForOrder } from '@/lib/stripe/checkout';
import { handleStripeWebhook } from '@/lib/stripe/webhooks';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/lib/checkout/core';

/**
 * Adaptador de Stripe para el sistema unificado de pagos
 */
export class StripeAdapter implements PaymentProvider {
  name = 'stripe';

  /**
   * Crea una sesión de checkout de Stripe para una orden
   */
  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSession> {
    // Extraer baseUrl de returnUrl
    const url = new URL(params.returnUrl);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Construir cancelUrl si no se proporciona
    let cancelUrl = params.cancelUrl;
    if (!cancelUrl) {
      const cancelUrlObj = params.cancelUrl ? new URL(params.cancelUrl) : url;
      cancelUrl = `${cancelUrlObj.protocol}//${cancelUrlObj.host}/checkout/${params.orderId}`;
    }
    
    const result = await createPaymentIntentForOrder(params.orderId, baseUrl, cancelUrl);
    
    if (!result.url) {
      throw new Error('No se pudo crear la sesión de checkout de Stripe');
    }
    
    return {
      url: result.url,
      sessionId: result.checkoutSession.id,
      provider: 'stripe',
    };
  }

  /**
   * Verifica el estado de un pago de Stripe después de que el usuario regresa
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerification> {
    const supabase = await createClient();
    const { sessionId, orderId, organizationId } = params;
    
    if (!sessionId) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: 'sessionId es requerido para Stripe',
      };
    }
    
    try {
      // Obtener checkout session de Stripe
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
      
      // Buscar pago en BD por session_id o order_id
      let payment = null;
      
      // Primero buscar por checkout_session_id en metadata
      const { data: sessionPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('provider', 'stripe')
        .eq('metadata->>checkout_session_id', sessionId)
        .maybeSingle();
      
      if (sessionPayment) {
        payment = sessionPayment;
      } else {
        // Si no se encuentra, buscar por order_id
        const { data: orderPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('provider', 'stripe')
          .eq('metadata->>order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (orderPayment) {
          payment = orderPayment;
        }
      }
      
      if (!payment) {
        return {
          success: false,
          paymentId: '',
          status: 'pending',
          error: 'Pago no encontrado en la base de datos',
        };
      }
      
      // Verificar estado del checkout session
      if (checkoutSession.status === 'complete' && checkoutSession.payment_status === 'paid') {
        // Pago exitoso - actualizar en BD si aún no está actualizado
        if (payment.status !== 'succeeded') {
          const paymentIntentId = typeof checkoutSession.payment_intent === 'string'
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id;
          
          const { data: updatedPayment, error: updateError } = await supabase
            .from('payments')
            .update({
              status: 'succeeded',
              provider_payment_id: paymentIntentId || payment.provider_payment_id,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              metadata: {
                ...payment.metadata,
                checkout_session_status: checkoutSession.status,
                payment_status: checkoutSession.payment_status,
              },
            })
            .eq('id', payment.id)
            .select('*')
            .single();
          
          if (!updateError && updatedPayment) {
            payment = updatedPayment;
            
            // Actualizar orden a 'paid'
            await updateOrderStatus(orderId, 'paid', {
              paymentId: payment.id,
            });
          }
        }
        
        return {
          success: true,
          paymentId: payment.id,
          status: 'succeeded',
        };
      } else if (checkoutSession.status === 'expired' || checkoutSession.payment_status === 'unpaid') {
        return {
          success: false,
          paymentId: payment.id,
          status: 'failed',
          error: 'El pago expiró o no fue completado',
        };
      } else {
        return {
          success: false,
          paymentId: payment.id,
          status: 'pending',
          error: 'El pago aún está pendiente',
        };
      }
    } catch (error: any) {
      console.error('[StripeAdapter] Error verificando pago:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error.message || 'Error verificando pago con Stripe',
      };
    }
  }

  /**
   * Procesa un webhook de Stripe
   */
  async processWebhook(event: any): Promise<WebhookResult> {
    try {
      await handleStripeWebhook(event);
      return {
        success: true,
        processed: true,
      };
    } catch (error: any) {
      console.error('[StripeAdapter] Error procesando webhook:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Error procesando webhook de Stripe',
      };
    }
  }
}

