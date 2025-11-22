import { stripe } from './client';
import { createClient } from '@/lib/supabase/server';
import { createOrGetCustomer } from './customers';

/**
 * Crea un SetupIntent para guardar un método de pago
 */
export async function createSetupIntent(orgId: string) {
  const customer = await createOrGetCustomer(orgId);
  
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    payment_method_types: ['card'],
  });
  
  return setupIntent;
}

/**
 * Guarda un método de pago después de que se completa el SetupIntent
 */
export async function attachPaymentMethod(
  orgId: string,
  paymentMethodId: string,
  setAsDefault = false
) {
  const supabase = await createClient();
  
  // Obtener customer_id
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!subscription?.stripe_customer_id) {
    throw new Error('Customer not found');
  }
  
  // Obtener método de pago de Stripe
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  
  // Adjuntar al customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: subscription.stripe_customer_id,
  });
  
  // Si es el primero o se marca como default, hacerlo default
  if (setAsDefault) {
    await stripe.customers.update(subscription.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }
  
  // Guardar en base de datos
  const { data: existingMethods } = await supabase
    .from('payment_methods')
    .select('is_default')
    .eq('organization_id', orgId)
    .eq('provider', 'stripe')
    .is('deleted_at', null);
  
  // Si no hay métodos o se marca como default, hacerlo default
  const shouldBeDefault = setAsDefault || (existingMethods?.length === 0);
  
  if (shouldBeDefault && existingMethods && existingMethods.length > 0) {
    // Quitar default de otros métodos
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('organization_id', orgId)
      .eq('provider', 'stripe')
      .is('deleted_at', null);
  }
  
  const { data: savedMethod, error } = await supabase
    .from('payment_methods')
    .insert({
      organization_id: orgId,
      type: 'stripe_card',
      provider: 'stripe',
      provider_payment_method_id: paymentMethodId,
      is_default: shouldBeDefault,
      last4: paymentMethod.card?.last4 || null,
      brand: paymentMethod.card?.brand || null,
      exp_month: paymentMethod.card?.exp_month || null,
      exp_year: paymentMethod.card?.exp_year || null,
      billing_details: paymentMethod.billing_details || {},
      metadata: paymentMethod.metadata || {},
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error saving payment method: ${error.message}`);
  }
  
  return savedMethod;
}

/**
 * Lista métodos de pago guardados de una organización
 */
export async function listPaymentMethods(orgId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('organization_id', orgId)
    .eq('provider', 'stripe')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error listing payment methods: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Marca un método de pago como default
 */
export async function setDefaultPaymentMethod(orgId: string, paymentMethodId: string) {
  const supabase = await createClient();
  
  // Obtener customer_id
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('stripe_customer_id')
    .eq('organization_id', orgId)
    .single();
  
  if (!subscription?.stripe_customer_id) {
    throw new Error('Customer not found');
  }
  
  // Obtener método de pago de la BD
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('provider_payment_method_id')
    .eq('id', paymentMethodId)
    .eq('organization_id', orgId)
    .single();
  
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  
  // Actualizar en Stripe
  await stripe.customers.update(subscription.stripe_customer_id, {
    invoice_settings: {
      default_payment_method: paymentMethod.provider_payment_method_id,
    },
  });
  
  // Actualizar en BD: quitar default de otros y poner en este
  await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('organization_id', orgId)
    .eq('provider', 'stripe')
    .is('deleted_at', null);
  
  const { data: updated, error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', paymentMethodId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating payment method: ${error.message}`);
  }
  
  return updated;
}

/**
 * Elimina un método de pago (soft delete)
 */
export async function deletePaymentMethod(orgId: string, paymentMethodId: string) {
  const supabase = await createClient();
  
  // Obtener método de pago
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('provider_payment_method_id, provider, is_default')
    .eq('id', paymentMethodId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();
  
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  
  // Si es Stripe, desadjuntar del customer
  if (paymentMethod.provider === 'stripe') {
    const { data: subscription } = await supabase
      .from('organization_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgId)
      .single();
    
    if (subscription?.stripe_customer_id) {
      try {
        await stripe.paymentMethods.detach(paymentMethod.provider_payment_method_id);
      } catch (error) {
        // Ignorar si ya está desadjuntado
      }
    }
  }
  
  // Soft delete en BD
  const { error } = await supabase
    .from('payment_methods')
    .update({ deleted_at: new Date().toISOString(), is_default: false })
    .eq('id', paymentMethodId);
  
  if (error) {
    throw new Error(`Error deleting payment method: ${error.message}`);
  }
  
  // Si era el default, marcar otro como default si existe
  if (paymentMethod.is_default) {
    const { data: otherMethods } = await supabase
      .from('payment_methods')
      .select('id')
      .eq('organization_id', orgId)
      .eq('provider', paymentMethod.provider)
      .is('deleted_at', null)
      .limit(1)
      .single();
    
    if (otherMethods) {
      await setDefaultPaymentMethod(orgId, otherMethods.id);
    }
  }
  
  return { success: true };
}

