import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';

export interface CreateCustomerData {
  email?: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Crea o obtiene un customer de Stripe para una organización
 */
export async function createOrGetCustomer(orgId: string, data?: CreateCustomerData) {
  const supabase = await createClient();
  
  // Verificar si ya existe un customer_id en la suscripción
  const { data: subscription, error: subError } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single();
  
  if (subError && subError.code !== 'PGRST116') {
    throw new Error(`Error fetching subscription: ${subError.message}`);
  }
  
  // Si ya existe customer_id, obtenerlo
  if (subscription?.stripe_customer_id) {
    try {
      const customer = await stripe.customers.retrieve(subscription.stripe_customer_id);
      if (!customer.deleted) {
        return customer;
      }
    } catch (error) {
      // Customer no existe en Stripe, crear uno nuevo
    }
  }
  
  // Obtener información de la organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, email')
    .eq('id', orgId)
    .single();
  
  if (orgError) {
    throw new Error(`Error fetching organization: ${orgError.message}`);
  }
  
  // Crear customer en Stripe
  const customer = await stripe.customers.create({
    email: data?.email || org.email || undefined,
    name: data?.name || org.name || undefined,
    metadata: {
      organization_id: orgId,
      ...data?.metadata,
    },
  });
  
  // Actualizar suscripción con customer_id
  const { error: updateError } = await supabase
    .from('organization_subscriptions')
    .update({ stripe_customer_id: customer.id })
    .eq('organization_id', orgId);
  
  if (updateError) {
    // Si no existe suscripción, crear una básica
    const { error: insertError } = await supabase
      .from('organization_subscriptions')
      .insert({
        organization_id: orgId,
        plan_id: (await supabase.from('subscription_plans').select('id').eq('slug', 'free').single()).data?.id,
        stripe_customer_id: customer.id,
        status: 'trial',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price_monthly: 0,
        price_yearly: 0,
      });
    
    if (insertError) {
      throw new Error(`Error creating subscription: ${insertError.message}`);
    }
  }
  
  return customer;
}

/**
 * Actualiza datos de un customer en Stripe
 */
export async function updateCustomer(orgId: string, data: Stripe.CustomerUpdateParams) {
  const supabase = await createClient();
  
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!subscription?.stripe_customer_id) {
    throw new Error('Customer not found for organization');
  }
  
  return await stripe.customers.update(subscription.stripe_customer_id, {
    ...data,
    metadata: {
      organization_id: orgId,
      ...data.metadata,
    },
  });
}

