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
 * @param baseUrl - URL base del sitio (opcional, se usa para construir URLs de redirect)
 * @param cancelUrl - URL a la que redirigir cuando el usuario cancela (opcional)
 */
export async function createPaymentIntentForOrder(
  orderId: string,
  baseUrl?: string,
  cancelUrl?: string
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
  
  // Descripción del producto para metadata
  const description = productData.name 
    ? `${productData.name} - ${productData.description || ''}`
    : `Producto ${order.product_type}`;
  
  // Actualizar orden a pending_payment (sin crear invoice)
  await updateOrderStatus(orderId, 'pending_payment');
  
  // Crear Checkout Session en Stripe (en lugar de Payment Intent)
  // Nota: Stripe requiere la moneda en lowercase (ars, brl, usd, etc.)
  const stripeCurrency = currency.toLowerCase();
  
  // Construir URLs de éxito y cancelación
  // Usar la URL proporcionada, o intentar detectarla desde variables de entorno
  const finalBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const successUrl = `${finalBaseUrl}/checkout/${orderId}/success?provider=stripe&session_id={CHECKOUT_SESSION_ID}`;
  const finalCancelUrl = cancelUrl || `${finalBaseUrl}/checkout/${orderId}`;
  
  console.log('💳 [Stripe Checkout] Creando Checkout Session:', {
    amount: total,
    currency: stripeCurrency,
    customerId: customer.id,
    countryCode,
    orderId,
    baseUrl: finalBaseUrl,
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
    cancel_url: finalCancelUrl,
    metadata: {
      organization_id: order.organization_id,
      order_id: orderId,
      order_number: order.order_number,
      product_type: order.product_type,
      product_id: order.product_id || '',
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
  
  // No registramos evento de pago iniciado - es un detalle técnico
  // El cliente verá "Pago confirmado" cuando el pago sea exitoso
  
  // Crear registro de pago en BD siempre
  // Usamos checkout_session_id como identificador temporal si no hay payment_intent
  let payment = null;
  const paymentIdentifier = checkoutSession.payment_intent 
    ? (checkoutSession.payment_intent as string)
    : `cs_${checkoutSession.id}`;
  
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: order.organization_id,
      provider: 'stripe',
      provider_payment_id: paymentIdentifier,
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
      paymentId: payment.id 
    });
  }
  
  return {
    checkoutSession,
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


