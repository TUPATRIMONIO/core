import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSession,
  VerifyPaymentParams,
  PaymentVerification,
  WebhookResult,
} from './base';
import { createDLocalCheckout, getDLocalPaymentStatus } from '@/lib/dlocal/checkout';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/lib/checkout/core';

/**
 * Adaptador de DLocal Go para el sistema unificado de pagos
 */
export class DLocalAdapter implements PaymentProvider {
  name = 'dlocalgo';

  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSession> {
    const supabase = await createClient();
    
    // Obtener datos de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('email, name, country')
      .eq('id', params.organizationId)
      .single();

    const billingData = params.metadata?.billing_data || {};

    const result = await createDLocalCheckout({
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency,
      country: org?.country || params.metadata?.country || 'CL',
      successUrl: params.returnUrl,
      backUrl: params.cancelUrl || params.returnUrl.replace('/success', ''),
      notificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/dlocal/webhook`,
      customer: {
        name: billingData.name || org?.name || '',
        email: billingData.email || org?.email || '',
        tax_id: billingData.tax_id,
      },
    });
    
    // Registrar pago en BD
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: params.organizationId,
        provider: 'dlocalgo',
        provider_payment_id: result.id,
        amount: params.amount,
        currency: params.currency,
        status: 'pending',
        metadata: {
          ...params.metadata,
        }
      });

    if (paymentError) {
      console.error('[DLocalAdapter] Error registrando pago en BD:', paymentError);
    }

    return {
      url: result.url,
      sessionId: result.id,
      provider: 'dlocalgo',
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerification> {
    const { token, orderId } = params;
    const paymentId = token || params.sessionId;
    
    if (!paymentId) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: 'paymentId/token es requerido para DLocal',
      };
    }
    
    try {
      const status = await getDLocalPaymentStatus(paymentId);
      const supabase = await createClient();
      
      // Status en DLocal: PAID, PENDING, REJECTED, CANCELLED
      const isPaid = status.status === 'PAID';
      
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('provider_payment_id', paymentId)
        .eq('provider', 'dlocalgo')
        .maybeSingle();

      if (isPaid && payment && payment.status === 'pending') {
        await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        await updateOrderStatus(orderId, 'paid', {
          paymentId: payment.id,
        });
      }

      return {
        success: isPaid,
        paymentId: payment?.id || '',
        status: isPaid ? 'succeeded' : (status.status === 'REJECTED' || status.status === 'CANCELLED' ? 'failed' : 'pending'),
      };
    } catch (error: any) {
      console.error('[DLocalAdapter] Error verificando pago:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error.message || 'Error verificando pago con DLocal',
      };
    }
  }

  async processWebhook(event: any): Promise<WebhookResult> {
    try {
      const { id, status, order_id } = event;
      if (!id) throw new Error('ID no proporcionado en webhook de DLocal');

      const isPaid = status === 'PAID';
      if (!isPaid) return { success: true, processed: false };

      const supabase = await createClient();
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, metadata')
        .eq('provider_payment_id', id)
        .eq('provider', 'dlocalgo')
        .maybeSingle();

      if (payment && payment.status === 'pending') {
        await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        const actualOrderId = payment.metadata?.order_id || order_id;
        await updateOrderStatus(actualOrderId, 'paid', {
          paymentId: payment.id,
        });

        return { success: true, processed: true };
      }

      return { success: true, processed: false };
    } catch (error: any) {
      console.error('[DLocalAdapter] Error en webhook:', error);
      return { success: false, processed: false, error: error.message };
    }
  }
}

