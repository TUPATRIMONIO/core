import { stripe } from './client';
import { createOrGetCustomer } from './customers';
import { createClient } from '@/lib/supabase/server';
import { getOrder, updateOrderStatus, canPayOrder } from '../checkout/core';

export interface CreateCheckoutSessionParams {
  orgId: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Crea un Payment Intent para una orden
 * @param orderId - ID de la orden (nuevo método)
 */
export async function createPaymentIntentForOrder(
  orderId: string
) {
  const supabase = await createClient();
  
  // Obtener orden
  const order = await getOrder(orderId);
  
  if (!order) {
    throw new Error('Orden no encontrada');
  }
  
  // Verificar que la orden puede ser pagada
  if (!canPayOrder(order)) {
    throw new Error('La orden no puede ser pagada (expirada o no pendiente)');
  }
  
  // Obtener organización para determinar país y moneda
  const { data: org } = await supabase
    .from('organizations')
    .select('country, email, name')
    .eq('id', order.organization_id)
    .single();
  
  if (!org) {
    throw new Error('Organización no encontrada');
  }
  
  const countryCode = org.country || 'US';
  const currency = order.currency || getCurrencyForCountry(countryCode);
  const amount = order.amount;
  
  // Obtener datos del producto desde product_data
  const productData = order.product_data as any;
  
  console.log('💰 [Stripe Checkout] Configuración de pago:', {
    countryCode,
    currency,
    amount,
    orderId,
    orderNumber: order.order_number,
    orgId: order.organization_id,
  });
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  // Stripe maneja monedas de manera diferente:
  // - Monedas con decimales (USD, EUR, ARS, BRL, etc.): multiplicar por 100 (centavos)
  // - Monedas sin decimales (CLP, JPY, etc.): usar monto directo (sin multiplicar)
  const total = convertAmountForStripe(amount + tax, currency);
  
  console.log('💰 [Stripe Checkout] Montos calculados:', {
    amount,
    tax,
    totalBeforeConversion: amount + tax,
    totalForStripe: total,
    currency,
    isZeroDecimal: isZeroDecimalCurrency(currency),
  });
  
  // Crear o obtener customer
  const customer = await createOrGetCustomer(order.organization_id, {
    email: org.email || undefined,
    name: org.name || undefined,
  });
  
  // Crear factura en BD primero
  let invoice = null;
  let invoiceError = null;
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const invoiceNumber = await generateInvoiceNumber(order.organization_id);
      
      const result = await supabase
        .from('invoices')
        .insert({
          organization_id: order.organization_id,
          invoice_number: invoiceNumber,
          status: 'open',
          type: order.product_type === 'credits' ? 'credit_purchase' : 'one_time',
          subtotal: amount,
          tax,
          total: amount + tax,
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
  const description = productData.name 
    ? `${productData.name} - ${productData.description || ''}`
    : `Producto ${order.product_type}`;
  
  await supabase
    .from('invoice_line_items')
    .insert({
      invoice_id: invoice.id,
      description,
      quantity: 1,
      unit_price: amount,
      total: amount + tax,
      type: order.product_type,
    });
  
  // Actualizar orden con invoice_id
  await updateOrderStatus(orderId, 'pending_payment', { invoiceId: invoice.id });
  
  // Crear Checkout Session en Stripe (en lugar de Payment Intent)
  // Nota: Stripe requiere la moneda en lowercase (ars, brl, usd, etc.)
  const stripeCurrency = currency.toLowerCase();
  
  // Construir URLs de éxito y cancelación
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/checkout/${orderId}/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/checkout/${orderId}`;
  
  console.log('💳 [Stripe Checkout] Creando Checkout Session:', {
    amount: total,
    currency: stripeCurrency,
    customerId: customer.id,
    countryCode,
    orderId,
    successUrl,
    cancelUrl,
  });
  
  // Crear Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: productData.name || description,
            description: productData.description || description,
          },
          unit_amount: total,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organization_id: order.organization_id,
      order_id: orderId,
      order_number: order.order_number,
      product_type: order.product_type,
      product_id: order.product_id || '',
      invoice_id: invoice.id,
      type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
      ...(order.product_type === 'credits' && productData.credits_amount 
        ? { credits_amount: productData.credits_amount.toString() }
        : {}),
      country_code: countryCode,
    },
    payment_intent_data: {
      description: description,
      metadata: {
        organization_id: order.organization_id,
        order_id: orderId,
        order_number: order.order_number,
        product_type: order.product_type,
        product_id: order.product_id || '',
        invoice_id: invoice.id,
        type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
        ...(order.product_type === 'credits' && productData.credits_amount 
          ? { credits_amount: productData.credits_amount.toString() }
          : {}),
        country_code: countryCode,
      },
    },
  });
  
  console.log('✅ [Stripe Checkout] Checkout Session creada:', {
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
    paymentIntentId: checkoutSession.payment_intent,
  });
  
  // Crear registro de pago en BD con el payment_intent_id si está disponible
  // Si no está disponible aún, el webhook lo creará cuando se complete el pago
  let payment = null;
  if (checkoutSession.payment_intent) {
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: order.organization_id,
        invoice_id: invoice.id,
        provider: 'stripe',
        provider_payment_id: checkoutSession.payment_intent as string,
        amount: amount + tax,
        currency,
        status: 'pending',
        metadata: {
          checkout_session_id: checkoutSession.id,
          order_id: orderId,
          order_number: order.order_number,
          product_type: order.product_type,
          product_id: order.product_id || '',
          type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
          ...(order.product_type === 'credits' && productData.credits_amount 
            ? { credits_amount: productData.credits_amount.toString() }
            : {}),
        },
      })
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creando registro de pago:', paymentError);
      // No fallar si hay error aquí, el webhook lo manejará
    } else {
      payment = paymentData;
      
      // Actualizar orden con payment_id
      await updateOrderStatus(orderId, 'pending_payment', { 
        invoiceId: invoice.id,
        paymentId: payment.id 
      });
    }
  } else {
    // Si no hay payment_intent aún, crear registro con checkout_session_id como provider_payment_id temporal
    // El webhook lo actualizará cuando se complete el pago
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        organization_id: order.organization_id,
        invoice_id: invoice.id,
        provider: 'stripe',
        provider_payment_id: checkoutSession.id, // Usar session_id temporalmente
        amount: amount + tax,
        currency,
        status: 'pending',
        metadata: {
          checkout_session_id: checkoutSession.id,
          order_id: orderId,
          order_number: order.order_number,
          product_type: order.product_type,
          product_id: order.product_id || '',
          type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
          ...(order.product_type === 'credits' && productData.credits_amount 
            ? { credits_amount: productData.credits_amount.toString() }
            : {}),
          is_temporary: true, // Marcar como temporal hasta que el webhook lo actualice
        },
      })
      .select()
      .single();
    
    if (paymentError) {
      console.error('Error creando registro de pago temporal:', paymentError);
    } else {
      payment = paymentData;
      
      // Actualizar orden con payment_id
      await updateOrderStatus(orderId, 'pending_payment', { 
        invoiceId: invoice.id,
        paymentId: payment.id 
      });
    }
  }
  
  return {
    checkoutSession,
    invoice,
    payment,
    url: checkoutSession.url, // URL de redirección para Stripe Checkout
    order,
  };
}

/**
 * Crea un Payment Intent para compra de créditos (método legacy)
 * @deprecated Usar createPaymentIntentForOrder en su lugar
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
  
  console.log('💰 [Stripe Checkout] Configuración de pago:', {
    countryCode,
    currency,
    amount,
    packageId: packageId,
    orgId,
  });
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  // Stripe maneja monedas de manera diferente:
  // - Monedas con decimales (USD, EUR, ARS, BRL, etc.): multiplicar por 100 (centavos)
  // - Monedas sin decimales (CLP, JPY, etc.): usar monto directo (sin multiplicar)
  const total = convertAmountForStripe(amount + tax, currency);
  
  console.log('💰 [Stripe Checkout] Montos calculados:', {
    amount,
    tax,
    totalBeforeConversion: amount + tax,
    totalForStripe: total,
    currency,
    isZeroDecimal: isZeroDecimalCurrency(currency),
  });
  
  // Crear o obtener customer
  const customer = await createOrGetCustomer(orgId, {
    email: org.email || undefined,
    name: org.name || undefined,
  });
  
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
          total: amount + tax,
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
  // Nota: Stripe requiere la moneda en lowercase (ars, brl, usd, etc.)
  const stripeCurrency = currency.toLowerCase();
  
  console.log('💳 [Stripe Checkout] Creando Payment Intent:', {
    amount: total,
    currency: stripeCurrency,
    customerId: customer.id,
    countryCode,
  });
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: stripeCurrency,
    customer: customer.id,
    metadata: {
      organization_id: orgId,
      package_id: packageId,
      invoice_id: invoice.id,
      type: 'credit_purchase',
      credits_amount: pkg.credits_amount.toString(),
      country_code: countryCode,
    },
    description: `Compra de ${pkg.credits_amount} créditos - ${pkg.name}`,
  });
  
  console.log('✅ [Stripe Checkout] Payment Intent creado:', {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
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
 * Lista de monedas zero-decimal según documentación de Stripe
 * https://stripe.com/docs/currencies#zero-decimal
 */
const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 
  'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
];

/**
 * Verifica si una moneda es zero-decimal
 */
export function isZeroDecimalCurrency(currency: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase());
}

/**
 * Convierte el monto según el tipo de moneda para Stripe
 * Monedas zero-decimal (CLP, JPY, etc.) no se multiplican por 100
 * Monedas estándar (USD, EUR, etc.) se multiplican por 100 (centavos)
 */
export function convertAmountForStripe(amount: number, currency: string): number {
  const currencyUpper = currency.toUpperCase();
  
  if (isZeroDecimalCurrency(currencyUpper)) {
    // Moneda zero-decimal: usar monto directo (redondeado)
    return Math.round(amount);
  } else {
    // Moneda estándar: convertir a centavos
    return Math.round(amount * 100);
  }
}

/**
 * Convierte el monto de Stripe de vuelta a formato normal
 * Monedas zero-decimal (CLP, JPY, etc.) no se dividen por 100
 * Monedas estándar (USD, EUR, etc.) se dividen por 100 (centavos)
 */
export function convertAmountFromStripe(amount: number, currency: string): number {
  const currencyUpper = currency.toUpperCase();
  
  if (isZeroDecimalCurrency(currencyUpper)) {
    // Moneda zero-decimal: usar monto directo
    return amount;
  } else {
    // Moneda estándar: convertir de centavos
    return amount / 100;
  }
}

/**
 * Obtiene moneda para un país
 */
export function getCurrencyForCountry(countryCode: string): string {
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
 * Obtiene precio localizado según país
 */
export function getLocalizedPrice(pkg: any, countryCode: string): number {
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

