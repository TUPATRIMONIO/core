import { createPayment, getPaymentStatus, DLocalPaymentRequest, DLocalPaymentResponse } from './client';
import { createClient } from '@/lib/supabase/server';
import { getAvailablePaymentMethods } from './client';

export interface CreateDLocalCheckoutParams {
  orgId: string;
  packageId: string;
  paymentMethodId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Crea un pago en dLocal para compra de créditos
 */
export async function createDLocalPaymentForCredits(
  orgId: string,
  packageId: string,
  paymentMethodId: string,
  successUrl: string,
  cancelUrl: string
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
  const total = amount + tax;
  
  // Crear factura en BD primero
  // Reintentar hasta 3 veces en caso de error de duplicado
  let invoice = null;
  let invoiceError = null;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const invoiceNumber = await generateInvoiceNumber();
    
    const result = await supabase
      .schema('billing')
      .from('invoices')
      .insert({
        organization_id: orgId,
        invoice_number: invoiceNumber,
        status: 'open',
        type: 'credit_purchase',
        subtotal: amount,
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
    throw new Error(`Error creando factura: ${invoiceError.message}`);
  }
  
  // Agregar línea de detalle
  await supabase
    .schema('billing')
    .from('invoice_line_items')
    .insert({
      invoice_id: invoice.id,
      description: `Paquete de ${pkg.credits_amount} créditos - ${pkg.name}`,
      quantity: 1,
      unit_price: amount,
      total,
      type: 'credits',
    });
  
  // Convertir paymentMethodId a formato payment_type según documentación dLocal Go
  const paymentTypeMap: Record<string, string> = {
    CARD: 'CREDIT_CARD, DEBIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    CASH: 'VOUCHER',
  };
  
  const paymentType = paymentTypeMap[paymentMethodId] || 'CREDIT_CARD, DEBIT_CARD';
  
  // Crear pago en dLocal Go
  const paymentRequest: DLocalPaymentRequest = {
    amount: total,
    currency: currency.toUpperCase(), // dLocal Go requiere uppercase
    country: countryCode,
    payment_type: paymentType,
    payer: {
      email: org.email || '',
      name: org.name || undefined,
    },
    order_id: invoice.id,
    description: `Compra de ${pkg.credits_amount} créditos - ${pkg.name}`.substring(0, 100), // Max 100 chars
    success_url: successUrl,
    back_url: cancelUrl,
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/dlocal/webhook`,
  };
  
  const dLocalPayment = await createPayment(paymentRequest);
  
  // Determinar si requiere redirección basándose en la respuesta de dLocal Go
  const requiresRedirect = !dLocalPayment.direct && !!dLocalPayment.redirect_url;
  
  // Crear registro de pago en BD
  const { data: payment, error: paymentError } = await supabase
    .schema('billing')
    .from('payments')
    .insert({
      organization_id: orgId,
      invoice_id: invoice.id,
      provider: 'dlocal',
      provider_payment_id: dLocalPayment.id,
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        dlocal_payment_id: dLocalPayment.id,
        payment_method_id: paymentMethodId,
        payment_type: paymentType,
        requires_redirect: requiresRedirect,
        redirect_url: dLocalPayment.redirect_url,
        merchant_checkout_token: dLocalPayment.merchant_checkout_token,
        direct: dLocalPayment.direct,
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  }
  
  return {
    payment: dLocalPayment,
    invoice,
    paymentRecord: payment,
    redirectUrl: dLocalPayment.redirect_url,
    requiresRedirect,
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
    // Fallback
    const year = new Date().getFullYear();
    const { count } = await supabase
      .schema('billing')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .like('invoice_number', `INV-${year}-%`);
    
    const seq = (count || 0) + 1;
    return `INV-${year}-${String(seq).padStart(5, '0')}`;
  }
  
  return data;
}

