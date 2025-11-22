import { stripe, StripeWebhookEvent } from './client';
import { createClient } from '@/lib/supabase/server';
import { addCredits } from '@/lib/credits/core';

/**
 * Maneja eventos de webhook de Stripe
 */
export async function handleStripeWebhook(event: StripeWebhookEvent) {
  const supabase = await createClient();
  
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
  const supabase = await createClient();
  
  const orgId = paymentIntent.metadata?.organization_id;
  if (!orgId) return;
  
  // Buscar pago en BD
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('provider_payment_id', paymentIntent.id)
    .eq('provider', 'stripe')
    .single();
  
  if (payment) {
    // Actualizar estado del pago
    await supabase
      .from('payments')
      .update({
        status: 'succeeded',
        processed_at: new Date().toISOString(),
      })
      .eq('id', payment.id);
    
    // Si es compra de créditos, agregar créditos
    if (paymentIntent.metadata?.type === 'credit_purchase') {
      const creditsAmount = parseFloat(paymentIntent.metadata.credits_amount || '0');
      if (creditsAmount > 0) {
        await addCredits(orgId, creditsAmount, 'credit_purchase', {
          payment_id: payment.id,
          stripe_payment_intent_id: paymentIntent.id,
        });
      }
    }
  }
}

/**
 * Maneja creación de suscripción
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;
  
  // Actualizar suscripción en BD
  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'active',
      stripe_subscription_id: subscription.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
}

/**
 * Maneja actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createClient();
  
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
  const supabase = await createClient();
  
  const orgId = subscription.metadata?.organization_id;
  if (!orgId) return;
  
  // Actualizar suscripción en BD
  await supabase
    .from('organization_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId);
}

/**
 * Maneja factura pagada (recarga créditos incluidos)
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
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
    await addCredits(orgId, monthlyCredits, 'subscription_monthly', {
      invoice_id: invoice.id,
      subscription_id: invoice.subscription,
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
    });
  }
  
  // Actualizar factura en BD
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('provider_invoice_id', invoice.id);
}

/**
 * Maneja fallo de pago de factura
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createClient();
  
  const orgId = invoice.metadata?.organization_id;
  if (!orgId) return;
  
  // Actualizar factura en BD
  await supabase
    .from('invoices')
    .update({
      status: 'open', // Mantener como open para reintentar
    })
    .eq('provider_invoice_id', invoice.id);
  
  // TODO: Enviar notificación al usuario
}

/**
 * Maneja SetupIntent exitoso (método de pago guardado)
 */
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  // Este evento se maneja en el frontend cuando el usuario completa el SetupIntent
  // Aquí solo podemos registrar el evento si es necesario
  console.log('SetupIntent succeeded:', setupIntent.id);
}

