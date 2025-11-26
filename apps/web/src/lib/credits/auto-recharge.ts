import { createClient } from '@/lib/supabase/server';
import { addCredits } from './core';
import { createPayment as createStripePayment } from '@/lib/stripe/subscriptions';
import { createPayment as createDLocalPayment } from '@/lib/dlocal/client';
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
  
  // Crear factura
  // La función generateInvoiceNumber() ya es thread-safe, pero aún así
  // manejamos errores de duplicado por si acaso
  let invoice = null;
  let invoiceError = null;
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const invoiceNumber = await generateInvoiceNumber();
      
      const result = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          invoice_number: invoiceNumber,
          status: 'open',
          type: 'credit_purchase',
          subtotal: price,
          tax: 0, // Se calculará después
          total: price,
          currency,
          due_date: new Date().toISOString(),
        })
        .select()
        .single();
      
      invoice = result.data;
      invoiceError = result.error;
      
      // Si no hay error, salir del loop
      if (!invoiceError) {
        break;
      }
      
      // Si es error de duplicado y no es el último intento, reintentar
      if (invoiceError.message.includes('duplicate key') && attempt < maxRetries - 1) {
        console.warn(`Intento ${attempt + 1}: Número de factura duplicado, reintentando...`);
        // Esperar un poco más en cada intento (exponencial backoff)
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
        continue;
      }
      
      // Si no es error de duplicado o es el último intento, salir
      break;
    } catch (error: any) {
      // Si generateInvoiceNumber() falla, reintentar
      if (attempt < maxRetries - 1) {
        console.warn(`Intento ${attempt + 1}: Error generando número de factura, reintentando...`, error);
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
        continue;
      }
      invoiceError = error;
      break;
    }
  }
  
  if (invoiceError || !invoice) {
    throw new Error(`Error creating invoice: ${invoiceError?.message || 'No se pudo crear la factura después de múltiples intentos'}`);
  }
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = price * (taxRate || 0);
  const total = price + tax;
  
  // Actualizar factura con impuesto
  await supabase
    .from('invoices')
    .update({ tax, total })
    .eq('id', invoice.id);
  
  // Crear pago según proveedor
  if (paymentMethod.provider === 'stripe') {
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
  } else if (paymentMethod.provider === 'dlocal') {
    // Para dLocal, crear pago y esperar webhook
    // Nota: dLocal generalmente requiere redirección, por lo que la auto-recarga
    // puede no ser completamente automática. En este caso, creamos el pago y
    // el usuario deberá completarlo manualmente si es necesario.
    const { createDLocalPaymentForCredits } = await import('@/lib/dlocal/checkout');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const successUrl = `${baseUrl}/billing/purchase-credits/success?dlocal_payment_id={payment_id}`;
    const cancelUrl = `${baseUrl}/billing`;
    
    // dLocal requiere métodos específicos, usar CARD por defecto
    await createDLocalPaymentForCredits(
      orgId,
      selectedPackage.id,
      'CARD', // Método de pago dLocal
      successUrl,
      cancelUrl
    );
    
    // Para dLocal, el pago se procesa asíncronamente vía webhook
    // Nota: Algunos métodos de dLocal requieren redirección, por lo que
    // la auto-recarga puede requerir intervención manual
    return true;
  } else {
    throw new Error(`Unknown payment provider: ${paymentMethod.provider}`);
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
  };
  
  const priceKey = currencyMap[countryCode.toUpperCase()] || 'price_usd';
  return pkg[priceKey] || pkg.price_usd || 0;
}

/**
 * Genera número de factura único usando función thread-safe de la BD
 * Reintenta hasta 5 veces si hay errores
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.rpc('generate_invoice_number');
    
    if (!error && data) {
      return data;
    }
    
    // Si es el último intento, lanzar error
    if (attempt === maxAttempts - 1) {
      console.error('Error generando número de factura después de', maxAttempts, 'intentos:', error);
      throw new Error(`No se pudo generar número de factura: ${error?.message || 'Unknown error'}`);
    }
    
    // Esperar un poco antes de reintentar (exponencial backoff)
    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
  }
  
  throw new Error('No se pudo generar número de factura después de múltiples intentos');
}

