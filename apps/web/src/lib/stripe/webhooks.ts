import { stripe, StripeWebhookEvent } from './client';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';
import { notifyCreditsAdded, notifyPaymentSucceeded, notifyPaymentFailed, notifySubscriptionCancelled } from '@/lib/notifications/billing';

/**
 * Maneja eventos de webhook de Stripe
 */
export async function handleStripeWebhook(event: StripeWebhookEvent) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    
    case 'setup_intent.succeeded':
      await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Maneja pago exitoso de créditos
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  console.log('🔔 Webhook recibido: payment_intent.succeeded', {
    paymentIntentId: paymentIntent.id,
    metadata: paymentIntent.metadata,
  });
  
  const orgId = paymentIntent.metadata?.organization_id;
  if (!orgId) {
    console.warn('⚠️  PaymentIntent sin organization_id en metadata:', paymentIntent.id);
    return;
  }
  
  // Buscar pago en BD (usar vista pública)
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
    .eq('provider_payment_id', paymentIntent.id)
    .eq('provider', 'stripe')
    .single();
  
  if (paymentError || !payment) {
    console.error('❌ Payment record not found for Stripe PaymentIntent:', {
      paymentIntentId: paymentIntent.id,
      error: paymentError?.message,
    });
    return;
  }
  
  console.log('✅ Payment encontrado:', {
    paymentId: payment.id,
    invoiceId: payment.invoice?.id,
    invoiceType: payment.invoice?.type,
  });
  
  // Actualizar estado del pago (usar vista pública)
  await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payment.id);
  
  // Actualizar factura si existe (usar vista pública)
  if (payment.invoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.invoice.id);
  }
  
  // Si es compra de créditos, agregar créditos
  if (paymentIntent.metadata?.type === 'credit_purchase') {
    const creditsAmount = parseFloat(paymentIntent.metadata.credits_amount || '0');
    console.log('💰 Agregando créditos:', {
      orgId,
      creditsAmount,
      type: paymentIntent.metadata.type,
    });
    
    if (creditsAmount > 0) {
      try {
        const transactionId = await addCredits(orgId, creditsAmount, 'credit_purchase', {
          payment_id: payment.id,
          stripe_payment_intent_id: paymentIntent.id,
          invoice_id: payment.invoice?.id,
        });
        console.log('✅ Créditos agregados exitosamente:', {
          transactionId,
          creditsAmount,
          orgId,
        });
        
        // Notificar créditos agregados
        try {
          await notifyCreditsAdded(
            orgId,
            creditsAmount,
            'credit_purchase',
            payment.invoice?.id
          );
        } catch (notifError: any) {
          console.error('Error enviando notificación de créditos agregados:', notifError);
        }
        
        // Notificar pago exitoso
        try {
          const amount = paymentIntent.amount / 100; // Convertir de centavos
          const currency = paymentIntent.currency.toUpperCase();
          await notifyPaymentSucceeded(
            orgId,
            amount,
            currency,
            payment.invoice?.id || ''
          );
        } catch (notifError: any) {
          console.error('Error enviando notificación de pago exitoso:', notifError);
        }
      } catch (error: any) {
        console.error('❌ Error agregando créditos:', {
          error: error.message,
          orgId,
          creditsAmount,
        });
      }
    } else {
      console.warn('⚠️  creditsAmount es 0 o inválido:', creditsAmount);
    }
  } else {
    console.log('ℹ️  PaymentIntent no es de tipo credit_purchase:', paymentIntent.metadata?.type);
  }
}

/**
 * Maneja creación de suscripción
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;
  
  // Actualizar o crear suscripción en BD
  const { data: existingSub } = await supabase
    .from('organization_subscriptions')
    .select('id')
    .eq('organization_id', orgId)
    .single();
  
  if (existingSub) {
    await supabase
      .from('organization_subscriptions')
      .update({
        status: 'active',
        stripe_subscription_id: subscription.id,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSub.id);
  }
}

/**
 * Maneja actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;
  
  // Determinar estado
  let status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due' = 'active';
  if (subscription.status === 'canceled') {
    status = 'cancelled';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'trialing') {
    status = 'trial';
  }
  
  // Actualizar suscripción en BD
  await supabase
    .from('organization_subscriptions')
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
}

/**
 * Maneja cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;
  
  // Obtener plan antes de actualizar
  const { data: subscriptionData } = await supabase
    .from('organization_subscriptions')
    .select('plan_id')
    .eq('organization_id', orgId)
    .single();
  
  let planName = 'Plan';
  if (subscriptionData?.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', subscriptionData.plan_id)
      .single();
    if (plan) {
      planName = plan.name;
    }
  }
  
  // Actualizar suscripción en BD
  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
  
  // Notificar cancelación
  try {
    await notifySubscriptionCancelled(orgId, planName);
  } catch (notifError: any) {
    console.error('Error enviando notificación de cancelación:', notifError);
  }
}

/**
 * Maneja factura pagada (recarga créditos incluidos)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  const orgId = invoice.metadata?.organization_id;
  if (!orgId || !invoice.subscription) return;
  
  // Obtener suscripción
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('plan_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!subscription) return;
  
  // Obtener plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('limits')
    .eq('id', subscription.plan_id)
    .single();
  
  if (!plan) return;
  
  // Obtener créditos mensuales incluidos
  const monthlyCredits = plan.limits?.credits?.monthly_included;
  if (monthlyCredits && typeof monthlyCredits === 'number' && monthlyCredits > 0) {
    // Agregar créditos mensuales
    const transactionId = await addCredits(orgId, monthlyCredits, 'subscription_monthly', {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
    });
    
    // Notificar créditos agregados por suscripción
    try {
      await notifyCreditsAdded(
        orgId,
        monthlyCredits,
        'subscription_monthly',
        existingInvoice?.id
      );
    } catch (notifError: any) {
      console.error('Error enviando notificación de créditos mensuales:', notifError);
    }
  }
  
  // Buscar factura en BD por provider_invoice_id o crear referencia (usar vista pública)
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id')
    .eq('provider_invoice_id', invoice.id)
    .single();
  
  if (existingInvoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', existingInvoice.id);
  }
}

/**
 * Maneja fallo de pago de factura
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Usar service role client para bypass RLS en webhooks
  const supabase = createServiceRoleClient();
  
  const orgId = invoice.metadata?.organization_id;
  if (!orgId) return;
  
  // Buscar factura en BD (usar vista pública)
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('id, total, currency')
    .eq('provider_invoice_id', invoice.id)
    .single();
  
  if (existingInvoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'open', // Mantener como open para reintentar
      })
      .eq('id', existingInvoice.id);
    
    // Notificar fallo de pago
    try {
      await notifyPaymentFailed(
        orgId,
        existingInvoice.total || 0,
        existingInvoice.currency || 'USD',
        existingInvoice.id,
        invoice.last_payment_error?.message || 'Error desconocido'
      );
    } catch (notifError: any) {
      console.error('Error enviando notificación de pago fallido:', notifError);
    }
  }
}

/**
 * Maneja SetupIntent exitoso (método de pago guardado)
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  // Este evento se maneja en el frontend cuando el usuario completa el SetupIntent
  // Aquí solo podemos registrar el evento si es necesario
  console.log('SetupIntent succeeded:', setupIntent.id);
}

