'use server';

import { createClient } from '@/lib/supabase/server';
import { createSetupIntent } from '@/lib/stripe/payment-methods';
import { attachPaymentMethod } from '@/lib/stripe/payment-methods';
import { purchasePackage } from '@/lib/credits/packages';
import { getBalance, getCreditAccount } from '@/lib/credits/core';

/**
 * Helper: Obtiene o crea organización para el usuario
 */
async function getOrCreateOrganization(userId: string, userEmail: string) {
  const supabase = await createClient();
  
  // Intentar obtener la organización activa del usuario usando la función RPC
  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: userId
  });
  
  if (activeOrg && activeOrg.length > 0) {
    return activeOrg[0].organization_id;
  }
  
  // Si no tiene organización, intentar crearla
  const { data: orgId, error: createError } = await supabase.rpc('create_personal_organization', {
    user_id: userId,
    user_email: userEmail,
    user_first_name: null
  });
  
  // Si hay error al crear, verificar si ya existe usando la función RPC
  if (createError) {
    const { data: retryActiveOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: userId
    });
    
    if (retryActiveOrg && retryActiveOrg.length > 0) {
      return retryActiveOrg[0].organization_id;
    }
    
    // Si aún no hay organización, lanzar el error original
    throw new Error(`No organization found and failed to create: ${createError.message || 'Unknown error'}`);
  }
  
  if (!orgId) {
    throw new Error('Failed to create organization: No ID returned');
  }
  
  return orgId;
}

/**
 * Crea un SetupIntent para guardar método de pago
 */
export async function createSetupIntentAction() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const setupIntent = await createSetupIntent(orgUser.organization_id);
  
  return {
    client_secret: setupIntent.client_secret,
    setup_intent_id: setupIntent.id,
  };
}

/**
 * Guarda un método de pago después de completar SetupIntent
 */
export async function savePaymentMethodAction(
  paymentMethodId: string,
  setAsDefault = false
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const method = await attachPaymentMethod(
    orgUser.organization_id,
    paymentMethodId,
    setAsDefault
  );
  
  return method;
}

/**
 * Compra un paquete de créditos
 */
export async function purchaseCreditsAction(
  packageId: string,
  paymentMethodId: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const result = await purchasePackage(
    orgUser.organization_id,
    packageId,
    paymentMethodId
  );
  
  return result;
}

/**
 * Actualiza configuración de auto-recarga
 */
export async function updateAutoRechargeSettingsAction(
  enabled: boolean,
  threshold?: number,
  amount?: number,
  paymentMethodId?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    throw new Error('No organization found');
  }
  
  const updates: any = {
    auto_recharge_enabled: enabled,
    updated_at: new Date().toISOString(),
  };
  
  if (threshold !== undefined) {
    updates.auto_recharge_threshold = threshold;
  }
  
  if (amount !== undefined) {
    updates.auto_recharge_amount = amount;
  }
  
  if (paymentMethodId !== undefined) {
    updates.auto_recharge_payment_method_id = paymentMethodId;
  }
  
  const { data, error } = await supabase
    .from('credit_accounts')
    .update(updates)
    .eq('organization_id', orgUser.organization_id)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Error updating auto-recharge settings: ${error.message}`);
  }
  
  return data;
}

/**
 * Actualiza el país de la organización del usuario
 */
export async function updateOrganizationCountryAction(countryCode: string) {
  const authSupabase = await createClient();
  
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Usar service role client para todas las operaciones (bypass RLS)
  const { createServiceRoleClient } = await import('@/lib/supabase/server');
  const supabase = createServiceRoleClient();
  
  // Obtener organización activa del usuario usando la función RPC
  const { data: activeOrgData, error: activeOrgError } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id
  });
  
  if (activeOrgError || !activeOrgData || activeOrgData.length === 0) {
    console.error('[updateOrganizationCountryAction] Error obteniendo org activa:', activeOrgError);
    throw new Error('No active organization found');
  }
  
  const organizationId = activeOrgData[0].organization_id;
  
  // Validar código de país (ISO 3166-1 alpha-2)
  const validCountryCodes = ['US', 'CL', 'AR', 'CO', 'MX', 'PE', 'BR'];
  if (!validCountryCodes.includes(countryCode.toUpperCase())) {
    throw new Error('Código de país no válido');
  }
  
  // Actualizar país de la organización
  const { error } = await supabase
    .from('organizations')
    .update({
      country: countryCode.toUpperCase(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);
  
  if (error) {
    console.error('[updateOrganizationCountryAction] Error actualizando país:', error);
    throw new Error(`Error actualizando país: ${error.message}`);
  }
  
  // Revalidar la página de configuración de facturación para que se actualice
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/billing/settings');
  
  return { success: true };
}

/**
 * Obtiene resumen de facturación
 */
export async function getBillingOverviewAction() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Obtener o crear organización
  const organizationId = await getOrCreateOrganization(user.id, user.email || 'test@tupatrimonio.com');
  
  // Obtener cuenta de créditos
  const account = await getCreditAccount(organizationId);
  const balance = await getBalance(organizationId);
  
  // Obtener suscripción
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      subscription_plans (*)
    `)
    .eq('organization_id', organizationId)
    .single();
  
  // Obtener métodos de pago
  const { data: paymentMethods } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false });
  
  // Obtener órdenes recientes (las facturas tributarias están en invoicing.documents)
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Obtener facturas recientes desde invoicing.documents
  const { data: invoices } = await supabase
    .from('invoicing_documents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  return {
    account,
    balance,
    subscription,
    paymentMethods: paymentMethods || [],
    recentOrders: orders || [],
    recentInvoices: invoices || [],
  };
}

