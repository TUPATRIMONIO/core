import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentSession,
  VerifyPaymentParams,
  PaymentVerification,
  WebhookResult,
} from './base';
import { createFlowPayment, getFlowPaymentStatus } from '@/lib/flow/checkout';
import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/lib/checkout/core';

/**
 * Adaptador de Flow.cl para el sistema unificado de pagos
 */
export class FlowAdapter implements PaymentProvider {
  name = 'flow';

  /**
   * Crea una orden de pago en Flow para una orden de TuPatrimonio
   */
  async createPaymentSession(params: CreatePaymentParams): Promise<PaymentSession> {
    const supabase = await createClient();
    
    // Obtener email de la organización para Flow
    const { data: org } = await supabase
      .from('organizations')
      .select('email, name')
      .eq('id', params.organizationId)
      .single();

    const result = await createFlowPayment({
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'CLP',
      email: org?.email || '',
      subject: `Pago Orden #${params.metadata?.order_number || params.orderId}`,
      urlConfirmation: `${process.env.NEXT_PUBLIC_APP_URL}/api/flow/webhook`,
      urlReturn: params.returnUrl,
    });
    
    if (!result.url || !result.token) {
      throw new Error('No se pudo crear la transacción de Flow');
    }
    
    // Registrar el pago en la base de datos (estado inicial)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: params.organizationId,
        provider: 'flow',
        provider_payment_id: result.token,
        amount: params.amount,
        currency: params.currency || 'CLP',
        status: 'pending',
        metadata: {
          ...params.metadata,
          flow_order: result.flowOrder,
        }
      });

    if (paymentError) {
      console.error('[FlowAdapter] Error registrando pago en BD:', paymentError);
    }

    return {
      url: result.url,
      sessionId: result.token,
      provider: 'flow',
    };
  }

  /**
   * Verifica el estado de un pago de Flow después de que el usuario regresa
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerification> {
    const { token, orderId } = params;
    
    if (!token) {
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: 'token es requerido para Flow',
      };
    }
    
    try {
      const status = await getFlowPaymentStatus(token);
      const supabase = await createClient();
      
      // Status en Flow: 1: Pendiente, 2: Pagado, 3: Rechazado, 4: Anulado
      const isPaid = status.status === 2;
      
      // Buscar pago en BD
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('provider_payment_id', token)
        .eq('provider', 'flow')
        .maybeSingle();

      if (isPaid && payment && payment.status === 'pending') {
        // Actualizar pago y orden
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'succeeded',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        if (!updateError) {
          await updateOrderStatus(orderId, 'paid', {
            paymentId: payment.id,
          });
        }
      }

      return {
        success: isPaid,
        paymentId: payment?.id || '',
        status: isPaid ? 'succeeded' : (status.status === 3 || status.status === 4 ? 'failed' : 'pending'),
      };
    } catch (error: any) {
      console.error('[FlowAdapter] Error verificando pago:', error);
      return {
        success: false,
        paymentId: '',
        status: 'failed',
        error: error.message || 'Error verificando pago con Flow',
      };
    }
  }

  /**
   * Procesa un webhook de Flow
   */
  async processWebhook(event: any): Promise<WebhookResult> {
    try {
      const { token } = event;
      if (!token) throw new Error('Token no proporcionado en webhook de Flow');

      const status = await getFlowPaymentStatus(token);
      const isPaid = status.status === 2;
      
      if (!isPaid) {
        return { success: true, processed: false };
      }

      const supabase = await createClient();
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, metadata')
        .eq('provider_payment_id', token)
        .eq('provider', 'flow')
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

        const orderId = payment.metadata?.order_id || status.commerceOrder;
        await updateOrderStatus(orderId, 'paid', {
          paymentId: payment.id,
        });

        return { success: true, processed: true };
      }

      return { success: true, processed: false };
    } catch (error: any) {
      console.error('[FlowAdapter] Error en webhook:', error);
      return { success: false, processed: false, error: error.message };
    }
  }
}

