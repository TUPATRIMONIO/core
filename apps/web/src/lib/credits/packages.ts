import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry, getLocalizedProductPrice, getCurrencyForCountrySync } from '../pricing/countries';

/**
 * Obtiene paquetes de créditos disponibles con precios localizados
 */
export async function getAvailablePackages(countryCode?: string) {
  const supabase = await createClient();
  
  const { data: packages, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  if (error) {
    throw new Error(`Error fetching packages: ${error.message}`);
  }
  
  if (!packages) {
    return [];
  }
  
  // Si se proporciona país, calcular precio localizado
  if (countryCode) {
    return packages.map(pkg => ({
      ...pkg,
      localized_price: getLocalizedProductPrice(pkg, countryCode),
      currency: getCurrencyForCountrySync(countryCode),
    }));
  }
  
  return packages;
}

/**
 * Compra un paquete de créditos
 */
export async function purchasePackage(
  orgId: string,
  packageId: string,
  paymentMethodId: string
) {
  const supabase = await createClient();
  
  // Obtener paquete
  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .eq('is_active', true)
    .single();
  
  if (pkgError || !pkg) {
    throw new Error('Package not found');
  }
  
  // Obtener organización para determinar país
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', orgId)
    .single();
  
  const countryCode = org?.country || 'US';
  const currency = await getCurrencyForCountry(countryCode);
  const price = getLocalizedProductPrice(pkg, countryCode);
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = price * (taxRate || 0);
  const total = price + tax;
  
  // Crear orden de compra
  const { createOrder } = await import('@/lib/checkout/core');
  
  const order = await createOrder({
    orgId,
    productType: 'credits',
    productId: packageId,
    productData: {
      name: pkg.name,
      description: `Paquete de ${pkg.credits_amount} créditos`,
      credits_amount: pkg.credits_amount,
    },
    amount: total,
    currency,
    metadata: {
      package_id: packageId,
      package_name: pkg.name,
      credits_amount: pkg.credits_amount,
      subtotal: price,
      tax,
    },
  });
  
  // Obtener método de pago
  const { data: paymentMethod } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', paymentMethodId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();
  
  if (!paymentMethod) {
    throw new Error('Payment method not found');
  }
  
  // Crear pago según proveedor (esto se manejará en las API routes)
  // Por ahora retornamos la información necesaria
  
  return {
    order,
    package: pkg,
    amount: total,
    currency,
    credits_amount: pkg.credits_amount,
    payment_method: paymentMethod,
  };
}

// Funciones getCurrencyForCountry y getLocalizedPrice movidas a lib/pricing/countries.ts
// Importadas arriba para mantener compatibilidad


