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
    throw new Error(`Error creando factura: ${invoiceError?.message || 'No se pudo crear la factura después de múltiples intentos'}`);
  }
  
  // Agregar línea de detalle
  await supabase
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
  
  // Construir notification_url desde successUrl para asegurar misma base URL
  // Extraer la base URL desde successUrl (antes de /billing)
  const baseUrlFromSuccess = successUrl.split('/billing')[0];
  const notificationUrl = `${baseUrlFromSuccess}/api/dlocal/webhook`;
  
  // Construir success_url usando order_id (invoice.id) como identificador temporal
  // dLocal Go requiere la success_url al crear el pago, pero el merchant_checkout_token
  // se genera después. Usaremos el order_id para identificar el pago inicialmente.
  // En la página de éxito, buscaremos el pago usando el merchant_checkout_token del metadata.
  const actualSuccessUrl = successUrl.includes('{MERCHANT_CHECKOUT_TOKEN}')
    ? `${baseUrlFromSuccess}/billing/purchase-credits/success?order_id=${invoice.id}`
    : successUrl;
  
  // Crear pago en dLocal Go
  const paymentRequest: DLocalPaymentRequest = {
    amount: total,
    currency: currency.toUpperCase(), // dLocal Go requiere uppercase
    country: countryCode,
    payment_type: paymentType,
    payer: {
      email: org.email || '',
      // No enviar el nombre para que el usuario pueda editarlo en el formulario de dlocalgo
    },
    order_id: invoice.id,
    description: `Compra de ${pkg.credits_amount} créditos - ${pkg.name}`.substring(0, 100), // Max 100 chars
    success_url: actualSuccessUrl,
    back_url: cancelUrl,
    notification_url: notificationUrl,
  };
  
  const dLocalPayment = await createPayment(paymentRequest);
  
  // Determinar si requiere redirección basándose en la respuesta de dLocal Go
  const requiresRedirect = !dLocalPayment.direct && !!dLocalPayment.redirect_url;
  
  // Crear registro de pago en BD
  console.log('💾 [dLocal Checkout] Guardando pago en BD:', {
    organizationId: orgId,
    invoiceId: invoice.id,
    providerPaymentId: dLocalPayment.id,
    orderId: dLocalPayment.order_id || invoice.id,
    amount: total,
    currency
  });
  
  const { data: payment, error: paymentError } = await supabase
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
        order_id: dLocalPayment.order_id || invoice.id, // Guardar order_id en metadata también
        payment_method_id: paymentMethodId,
        payment_type: paymentType,
        requires_redirect: requiresRedirect,
        redirect_url: dLocalPayment.redirect_url,
        merchant_checkout_token: dLocalPayment.merchant_checkout_token,
        direct: dLocalPayment.direct,
        credits_amount: pkg.credits_amount, // Agregar cantidad de créditos al metadata
        package_id: packageId, // Agregar package_id también
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('❌ [dLocal Checkout] Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  } else {
    console.log('✅ [dLocal Checkout] Pago guardado en BD:', {
      paymentId: payment.id,
      providerPaymentId: payment.provider_payment_id,
      invoiceId: payment.invoice_id
    });
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

