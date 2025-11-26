import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';
import { createOrGetCustomer } from './customers';
import { convertAmountForStripe } from './checkout';

/**
 * Crea una suscripción en Stripe
 */
export async function createSubscription(
  orgId: string,
  planId: string,
  paymentMethodId?: string
) {
  const supabase = await createClient();
  
  // Obtener plan
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (planError || !plan) {
    throw new Error('Plan not found');
  }
  
  // Obtener o crear customer
  const customer = await createOrGetCustomer(orgId);
  
  // Crear suscripción en Stripe
  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: customer.id,
    items: [
      {
        price_data: {
          currency: plan.currency || 'usd',
          unit_amount: convertAmountForStripe(plan.price_monthly, plan.currency || 'usd'),
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
          },
        },
      },
    ],
    metadata: {
      organization_id: orgId,
      plan_id: planId,
    },
  };
  
  if (paymentMethodId) {
    subscriptionParams.default_payment_method = paymentMethodId;
  }
  
  const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);
  
  // Calcular fechas del período
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  
  // Guardar en BD
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .upsert({
      organization_id: orgId,
      plan_id: planId,
      status: 'active',
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: customer.id,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
    })
    .select()
    .single();
  
  if (subError) {
    throw new Error(`Error saving subscription: ${subError.message}`);
  }
  
  return { stripeSubscription, subscription };
}

/**
 * Actualiza una suscripción (cambio de plan)
 */
export async function updateSubscription(orgId: string, planId: string) {
  const supabase = await createClient();
  
  // Obtener suscripción actual
  const { data: currentSub } = await supabase
    .from('organization_subscriptions')
    .select('stripe_subscription_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!currentSub?.stripe_subscription_id) {
    throw new Error('Subscription not found');
  }
  
  // Obtener plan nuevo
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single();
  
  if (!plan) {
    throw new Error('Plan not found');
  }
  
  // Obtener suscripción de Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
  
  // Actualizar en Stripe
  const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price_data: {
          currency: plan.currency || 'usd',
          unit_amount: convertAmountForStripe(plan.price_monthly, plan.currency || 'usd'),
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
          },
        },
      },
    ],
    metadata: {
      organization_id: orgId,
      plan_id: planId,
    },
    proration_behavior: 'create_prorations',
  });
  
  // Actualizar en BD
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .update({
      plan_id: planId,
      current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating subscription: ${error.message}`);
  }
  
  return { stripeSubscription: updatedSubscription, subscription };
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(orgId: string, immediately = false) {
  const supabase = await createClient();
  
  const { data: currentSub } = await supabase
    .from('organization_subscriptions')
    .select('stripe_subscription_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!currentSub?.stripe_subscription_id) {
    throw new Error('Subscription not found');
  }
  
  // Cancelar en Stripe
  const canceledSubscription = await stripe.subscriptions.cancel(currentSub.stripe_subscription_id, {
    invoice_now: immediately,
    prorate: !immediately,
  });
  
  // Actualizar en BD
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error canceling subscription: ${error.message}`);
  }
  
  return { stripeSubscription: canceledSubscription, subscription };
}

/**
 * Reanuda una suscripción cancelada
 */
export async function resumeSubscription(orgId: string) {
  const supabase = await createClient();
  
  const { data: currentSub } = await supabase
    .from('organization_subscriptions')
    .select('stripe_subscription_id, plan_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!currentSub?.stripe_subscription_id) {
    throw new Error('Subscription not found');
  }
  
  // Obtener plan
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', currentSub.plan_id)
    .single();
  
  if (!plan) {
    throw new Error('Plan not found');
  }
  
  // Reanudar en Stripe
  const resumedSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
    cancel_at_period_end: false,
    items: [
      {
        id: (await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id)).items.data[0].id,
        price_data: {
          currency: plan.currency || 'usd',
          unit_amount: convertAmountForStripe(plan.price_monthly, plan.currency || 'usd'),
          recurring: {
            interval: 'month',
          },
          product_data: {
            name: plan.name,
            description: plan.description || undefined,
          },
        },
      },
    ],
  });
  
  // Actualizar en BD
  const { data: subscription, error } = await supabase
    .from('organization_subscriptions')
    .update({
      status: 'active',
      cancelled_at: null,
      current_period_start: new Date(resumedSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(resumedSubscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', orgId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error resuming subscription: ${error.message}`);
  }
  
  return { stripeSubscription: resumedSubscription, subscription };
}

