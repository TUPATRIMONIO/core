import { stripe } from './client';
import { createOrGetCustomer } from './customers';
import { createClient } from '@/lib/supabase/server';

export interface CreateCheckoutSessionParams {
  orgId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Crea un Payment Intent para compra de créditos
 */
export async function createPaymentIntentForCredits(
  orgId: string,
  packageId: string
) {
  const supabase = await createClient();
  
  // Obtener paquete (usar la vista pública para consistencia con getAvailablePackages)
  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .eq('is_active', true)
    .single();
  
  if (pkgError || !pkg) {
    console.error('Error buscando paquete:', pkgError);
    console.error('PackageId recibido:', packageId);
    throw new Error(`Paquete no encontrado: ${pkgError?.message || 'Unknown error'}`);
  }
  
  // Obtener organización para determinar país y moneda
  const { data: org } = await supabase
    .from('organizations')
    .select('country, email, name')
    .eq('id', orgId)
    .single();
  
  if (!org) {
    throw new Error('Organización no encontrada');
  }
  
  const countryCode = org.country || 'US';
  const currency = getCurrencyForCountry(countryCode);
  const amount = getLocalizedPrice(pkg, countryCode);
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  const total = Math.round((amount + tax) * 100); // Convertir a centavos
  
  // Crear o obtener customer
  const customer = await createOrGetCustomer(orgId, {
    email: org.email || undefined,
    name: org.name || undefined,
  });
  
  // Crear factura en BD primero (usar vista pública)
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: orgId,
      invoice_number: await generateInvoiceNumber(),
      status: 'open',
      type: 'credit_purchase',
      subtotal: amount,
      tax,
      total: amount + tax,
      currency,
      due_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (invoiceError) {
    throw new Error(`Error creando factura: ${invoiceError.message}`);
  }
  
  // Agregar línea de detalle (usar vista pública)
  await supabase
    .from('invoice_line_items')
    .insert({
      invoice_id: invoice.id,
      description: `Paquete de ${pkg.credits_amount} créditos - ${pkg.name}`,
      quantity: 1,
      unit_price: amount,
      total: amount + tax,
      type: 'credits',
    });
  
  // Crear Payment Intent en Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: currency.toLowerCase(),
    customer: customer.id,
    metadata: {
      organization_id: orgId,
      package_id: packageId,
      invoice_id: invoice.id,
      type: 'credit_purchase',
      credits_amount: pkg.credits_amount.toString(),
    },
    description: `Compra de ${pkg.credits_amount} créditos - ${pkg.name}`,
  });
  
  // Crear registro de pago en BD (usar vista pública)
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: orgId,
      invoice_id: invoice.id,
      provider: 'stripe',
      provider_payment_id: paymentIntent.id,
      amount: amount + tax,
      currency,
      status: 'pending',
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  }
  
  return {
    paymentIntent,
    invoice,
    payment,
    clientSecret: paymentIntent.client_secret,
  };
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
 * Genera número de factura
 */
async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_invoice_number');
  
  if (error) {
    // Fallback (usar vista pública)
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

