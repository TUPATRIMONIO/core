import { createClient } from '@/lib/supabase/server';

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
      localized_price: getLocalizedPrice(pkg, countryCode),
      currency: getCurrencyForCountry(countryCode),
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
  const currency = getCurrencyForCountry(countryCode);
  const price = getLocalizedPrice(pkg, countryCode);
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = price * (taxRate || 0);
  const total = price + tax;
  
  // Crear factura
  // Reintentar hasta 3 veces en caso de error de duplicado
  let invoice = null;
  let invoiceError = null;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const invoiceNumber = await generateInvoiceNumber();
    
    const result = await supabase
      .from('invoices')
      .insert({
        organization_id: orgId,
        invoice_number: invoiceNumber,
        status: 'open',
        type: 'credit_purchase',
        subtotal: price,
        tax,
        total,
        currency,
        due_date: new Date().toISOString(),
      })
      .select()
      .single();
    
    invoice = result.data;
    invoiceError = result.error;
    
    // Si no hay error o el error no es de duplicado, salir del loop
    if (!invoiceError || !invoiceError.message.includes('duplicate key')) {
      break;
    }
    
    // Si es error de duplicado y no es el último intento, esperar un poco y reintentar
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
  
  if (invoiceError) {
    throw new Error(`Error creating invoice: ${invoiceError.message}`);
  }
  
  // Agregar línea de detalle
  await supabase
    .from('invoice_line_items')
    .insert({
      invoice_id: invoice.id,
      description: `Paquete de ${pkg.credits_amount} créditos - ${pkg.name}`,
      quantity: 1,
      unit_price: price,
      total,
      type: 'credits',
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
    invoice,
    package: pkg,
    amount: total,
    currency,
    credits_amount: pkg.credits_amount,
    payment_method: paymentMethod,
  };
}

/**
 * Obtiene precio localizado según país
 */
function getLocalizedPrice(pkg: any, countryCode: string): number {
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

