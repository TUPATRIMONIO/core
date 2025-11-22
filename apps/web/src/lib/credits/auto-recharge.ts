import { createClient } from '@/lib/supabase/server';
import { addCredits } from './core';
import { createPayment as createStripePayment } from '@/lib/stripe/subscriptions';
import { createPayment as createDLocalPayment } from '@/lib/dlocal/client';

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
  
  // Obtener método de pago
  const { data: paymentMethod } = await supabase
    .schema('billing')
    .from('payment_methods')
    .select('*')
    .eq('id', account.auto_recharge_payment_method_id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();
  
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  
  // Obtener paquete de créditos equivalente
  const { data: packages } = await supabase
    .schema('credits')
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
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      invoice_number: await generateInvoiceNumber(),
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
  
  if (invoiceError) {
    throw new Error(`Error creating invoice: ${invoiceError.message}`);
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
  let payment;
  
  if (paymentMethod.provider === 'stripe') {
    // Usar Stripe Payment Intent
    // TODO: Implementar creación de Payment Intent con Stripe
    throw new Error('Stripe auto-recharge not yet implemented');
  } else if (paymentMethod.provider === 'dlocal') {
    // Usar dLocal
    // TODO: Implementar creación de pago con dLocal
    throw new Error('dLocal auto-recharge not yet implemented');
  } else {
    throw new Error(`Unknown payment provider: ${paymentMethod.provider}`);
  }
  
  // Si el pago es exitoso, los créditos se agregarán vía webhook
  return true;
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
 * Genera número de factura
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_invoice_number');
  
  if (error) {
    // Fallback
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .like('invoice_number', `INV-${year}-%`);
    
    const seq = (count || 0) + 1;
    return `INV-${year}-${String(seq).padStart(5, '0')}`;
  }
  
  return data;
}

