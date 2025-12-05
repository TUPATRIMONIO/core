import { createClient } from '@/lib/supabase/server';
import { addCredits } from './core';
import { notifyAutoRechargeExecuted, notifyAutoRechargeFailed } from '@/lib/notifications/billing';

/**
 * Verifica y ejecuta auto-recarga si es necesario
 */
export async function checkAndRecharge(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener cuenta de créditos
  const { data: account } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  if (!account || !account.auto_recharge_enabled) {
    return false;
  }
  
  // Calcular balance disponible
  const availableBalance = account.balance - account.reserved_balance;
  
  // Verificar si está por debajo del threshold
  if (availableBalance > (account.auto_recharge_threshold || 0)) {
    return false;
  }
  
  // Ejecutar auto-recarga
  return await executeAutoRecharge(orgId);
}

/**
 * Ejecuta recarga automática
 */
export async function executeAutoRecharge(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener cuenta de créditos
  const { data: account } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  if (!account || !account.auto_recharge_enabled) {
    throw new Error('Auto-recharge not enabled');
  }
  
  if (!account.auto_recharge_payment_method_id) {
    throw new Error('No payment method configured for auto-recharge');
  }
  
  if (!account.auto_recharge_amount || account.auto_recharge_amount <= 0) {
    throw new Error('Invalid auto-recharge amount');
  }
  
  // Obtener método de pago (usar vista pública)
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', account.auto_recharge_payment_method_id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();
  
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  
  // Obtener paquete de créditos equivalente (usar vista pública)
  const { data: packages } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('credits_amount', { ascending: true });
  
  // Encontrar paquete más cercano al monto de recarga
  const targetCredits = account.auto_recharge_amount;
  let selectedPackage = packages?.[0];
  
  if (packages) {
    for (const pkg of packages) {
      if (pkg.credits_amount >= targetCredits) {
        selectedPackage = pkg;
        break;
      }
    }
  }
  
  if (!selectedPackage) {
    throw new Error('No credit package found');
  }
  
  // Obtener organización para obtener país y moneda
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', orgId)
    .single();
  
  const countryCode = org?.country || 'US';
  const currency = getCurrencyForCountry(countryCode);
  
  // Calcular precio según país
  const price = getPriceForCountry(selectedPackage, countryCode);
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = price * (taxRate || 0);
  const total = price + tax;
  
  // Crear orden de compra para auto-recarga
  const { createOrder } = await import('@/lib/checkout/core');
  
  const order = await createOrder({
    orgId,
    productType: 'credits',
    productId: selectedPackage.id,
    productData: {
      name: selectedPackage.name,
      description: `Auto-recarga: Paquete de ${selectedPackage.credits_amount} créditos`,
      credits_amount: selectedPackage.credits_amount,
    },
    amount: total,
    currency,
    metadata: {
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
      credits_amount: selectedPackage.credits_amount,
      subtotal: price,
      tax,
      auto_recharge: true,
    },
  });
  
  // Crear pago con Stripe usando el método de pago guardado
  if (paymentMethod.provider !== 'stripe') {
    throw new Error(`Unsupported payment provider: ${paymentMethod.provider}. Only Stripe is supported.`);
  }

  // Crear Payment Intent con Stripe usando el método de pago guardado
  const { createPaymentIntentForCredits } = await import('@/lib/stripe/checkout');
  const { stripe } = await import('@/lib/stripe/client');
  
  const result = await createPaymentIntentForCredits(orgId, selectedPackage.id);
  
  // Confirmar pago automáticamente usando el método de pago guardado
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(result.paymentIntent.id, {
      payment_method: paymentMethod.provider_payment_method_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/billing`,
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Los créditos se agregarán vía webhook handlePaymentIntentSucceeded
      // Notificar ejecución exitosa
      try {
        await notifyAutoRechargeExecuted(
          orgId,
          total,
          selectedPackage.credits_amount
        );
      } catch (notifError: any) {
        console.error('Error enviando notificación de auto-recarga:', notifError);
      }
      return true;
    } else if (paymentIntent.status === 'requires_action') {
      // Si requiere 3D Secure, no podemos procesarlo automáticamente
      // Notificar al usuario
      const errorMsg = 'Payment requires 3D Secure authentication. Please complete manually.';
      try {
        await notifyAutoRechargeFailed(orgId, errorMsg);
      } catch (notifError: any) {
        console.error('Error enviando notificación de auto-recarga fallida:', notifError);
      }
      throw new Error(errorMsg);
    } else {
      const errorMsg = `Payment failed: ${paymentIntent.status}`;
      try {
        await notifyAutoRechargeFailed(orgId, errorMsg);
      } catch (notifError: any) {
        console.error('Error enviando notificación de auto-recarga fallida:', notifError);
      }
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    // Si falla la confirmación automática, registrar el error pero no fallar completamente
    // El usuario puede completar el pago manualmente más tarde
    console.error('Error confirming auto-recharge payment:', error);
    
    // Notificar fallo
    try {
      await notifyAutoRechargeFailed(orgId, error.message);
    } catch (notifError: any) {
      console.error('Error enviando notificación de auto-recarga fallida:', notifError);
    }
    
    throw new Error(`Error procesando auto-recarga: ${error.message}`);
  }
}

/**
 * Obtiene moneda para un país
 */
function getCurrencyForCountry(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    CL: 'CLP',
    AR: 'ARS',
    CO: 'COP',
    MX: 'MXN',
    PE: 'PEN',
    BR: 'BRL',
    US: 'USD',
  };
  
  return currencyMap[countryCode.toUpperCase()] || 'USD';
}

/**
 * Obtiene precio de paquete según país
 */
function getPriceForCountry(pkg: any, countryCode: string): number {
  const currencyMap: Record<string, keyof typeof pkg> = {
    CL: 'price_clp',
    AR: 'price_ars',
    CO: 'price_cop',
    MX: 'price_mxn',
    PE: 'price_pen',
    BR: 'price_brl',
  };
  
  const priceKey = currencyMap[countryCode.toUpperCase()] || 'price_usd';
  return pkg[priceKey] || pkg.price_usd || 0;
}


