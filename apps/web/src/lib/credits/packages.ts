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
  // La función generateInvoiceNumber() ya es thread-safe, pero aún así
  // manejamos errores de duplicado por si acaso
  let invoice = null;
  let invoiceError = null;
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const invoiceNumber = await generateInvoiceNumber(orgId);
      
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
 * Genera número de factura único usando función thread-safe de la BD
 * Formato: {ORG_SLUG}-{NÚMERO} (ej: TU-PATRIMONIO-000001)
 * Reintenta hasta 5 veces si hay errores
 */
async function generateInvoiceNumber(orgId: string): Promise<string> {
  const supabase = await createClient();
  const maxAttempts = 5;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data, error } = await supabase.rpc('generate_invoice_number', {
      org_id: orgId
    });
    
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

