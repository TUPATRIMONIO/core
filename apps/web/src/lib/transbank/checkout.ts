import { transbankClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry, getLocalizedPrice } from '../stripe/checkout';
import { getOrder, updateOrderStatus, canPayOrder } from '../checkout/core';

/**
 * Crea un pago Webpay Plus para una orden
 * @param orderId - ID de la orden (nuevo método)
 * @param returnUrl - URL de retorno después del pago
 */
export async function createTransbankPaymentForOrder(
  orderId: string,
  returnUrl: string
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
  
  const countryCode = org.country || 'CL';
  const currency = order.currency || getCurrencyForCountry(countryCode);
  const amount = order.amount;
  
  // Obtener datos del producto desde product_data
  const productData = order.product_data as any;
  const pkg = productData; // Para compatibilidad con código existente
  
  console.log('💰 [Transbank Checkout] Configuración de pago:', {
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
  const total = amount + tax;
  
  // Transbank usa CLP (moneda zero-decimal, no multiplicar por 100)
  const transbankAmount = Math.round(total);
  
  console.log('💰 [Transbank Checkout] Montos calculados:', {
    amount,
    tax,
    total,
    transbankAmount,
    currency,
  });
  
  // Crear factura en BD primero
  const invoiceNumber = await generateInvoiceNumber(order.organization_id);
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: order.organization_id,
      invoice_number: invoiceNumber,
      status: 'open',
      type: order.product_type === 'credits' ? 'credit_purchase' : 'one_time',
      subtotal: amount,
      tax,
      total,
      currency,
      due_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (invoiceError || !invoice) {
    throw new Error(`Error creando factura: ${invoiceError?.message || 'Unknown error'}`);
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
      total,
      type: order.product_type,
    });
  
  // Registrar evento de factura creada
  try {
    await supabase.rpc('log_order_event', {
      p_order_id: orderId,
      p_event_type: 'invoice_created',
      p_description: `Factura creada: ${invoice.invoice_number} - Monto: ${total} ${currency}`,
      p_metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        amount: total,
        currency: currency,
        tax: tax,
      },
      p_user_id: null,
      p_from_status: null,
      p_to_status: null,
    });
  } catch (error: any) {
    console.error('[createTransbankPaymentForOrder] Error registrando evento de factura:', error);
  }
  
  // Actualizar orden con invoice_id
  await updateOrderStatus(orderId, 'pending_payment', { invoiceId: invoice.id });
  
  // Generar buy_order único (máximo 26 caracteres)
  const buyOrder = `TP-${invoice.id.substring(0, 20)}`;
  const sessionId = `session-${Date.now()}-${order.organization_id.substring(0, 10)}`;
  
  // Crear transacción en Transbank
  const transaction = await transbankClient.createWebpayPlusTransaction({
    buy_order: buyOrder,
    session_id: sessionId,
    amount: transbankAmount,
    return_url: returnUrl,
  });
  
  console.log('✅ [Transbank Checkout] Transacción creada (Order):', {
    token: transaction.token,
    url: transaction.url,
    buyOrder,
    urlHostname: transaction.url ? new URL(transaction.url).hostname : 'N/A',
    urlPathname: transaction.url ? new URL(transaction.url).pathname : 'N/A',
  });
  
  // Registrar evento de pago iniciado
  try {
    await supabase.rpc('log_order_event', {
      p_order_id: orderId,
      p_event_type: 'payment_initiated',
      p_description: `Pago iniciado vía Transbank Webpay Plus`,
      p_metadata: {
        provider: 'transbank',
        payment_type: 'webpay_plus',
        token: transaction.token,
        buy_order: buyOrder,
        amount: transbankAmount,
        currency: currency,
        invoice_id: invoice.id,
      },
      p_user_id: null,
      p_from_status: null,
      p_to_status: null,
    });
  } catch (error: any) {
    console.error('[createTransbankPaymentForOrder] Error registrando evento de pago iniciado:', error);
  }
  
  // Crear registro de pago en BD
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: order.organization_id,
      invoice_id: invoice.id,
      provider: 'transbank',
      provider_payment_id: transaction.token,
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        buy_order: buyOrder,
        session_id: sessionId,
        order_id: orderId,
        order_number: order.order_number,
        product_type: order.product_type,
        product_id: order.product_id,
        ...(order.product_type === 'credits' && productData.credits_amount 
          ? { credits_amount: productData.credits_amount }
          : {}),
        type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  }
  
  // Actualizar orden con payment_id
  await updateOrderStatus(orderId, 'pending_payment', { 
    invoiceId: invoice.id,
    paymentId: payment?.id 
  });
  
  return {
    token: transaction.token,
    url: transaction.url,
    invoice,
    payment,
    order,
  };
}

/**
 * Crea un pago Webpay Plus para compra de créditos (método legacy)
 * @deprecated Usar createTransbankPaymentForOrder en su lugar
 */
export async function createTransbankPaymentForCredits(
  orgId: string,
  packageId: string,
  returnUrl: string
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
    console.error('Error buscando paquete:', pkgError);
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
  
  const countryCode = org.country || 'CL';
  const currency = getCurrencyForCountry(countryCode);
  const amount = getLocalizedPrice(pkg, countryCode);
  
  console.log('💰 [Transbank Checkout] Configuración de pago (legacy):', {
    countryCode,
    currency,
    amount,
    packageId,
    orgId,
  });
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  const total = amount + tax;
  
  // Transbank usa CLP (moneda zero-decimal, no multiplicar por 100)
  const transbankAmount = Math.round(total);
  
  console.log('💰 [Transbank Checkout] Montos calculados:', {
    amount,
    tax,
    total,
    transbankAmount,
    currency,
  });
  
  // Crear factura en BD primero
  const invoiceNumber = await generateInvoiceNumber(orgId);
  
  const { data: invoice, error: invoiceError } = await supabase
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
  
  if (invoiceError || !invoice) {
    throw new Error(`Error creando factura: ${invoiceError?.message || 'Unknown error'}`);
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
  
  // Generar buy_order único (máximo 26 caracteres)
  const buyOrder = `TP-${invoice.id.substring(0, 20)}`;
  const sessionId = `session-${Date.now()}-${orgId.substring(0, 10)}`;
  
  // Crear transacción en Transbank
  const transaction = await transbankClient.createWebpayPlusTransaction({
    buy_order: buyOrder,
    session_id: sessionId,
    amount: transbankAmount,
    return_url: returnUrl,
  });
  
  console.log('✅ [Transbank Checkout] Transacción creada (Credits):', {
    token: transaction.token,
    url: transaction.url,
    buyOrder,
    urlHostname: transaction.url ? new URL(transaction.url).hostname : 'N/A',
    urlPathname: transaction.url ? new URL(transaction.url).pathname : 'N/A',
  });
  
  // Crear registro de pago en BD
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: orgId,
      invoice_id: invoice.id,
      provider: 'transbank',
      provider_payment_id: transaction.token,
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        buy_order: buyOrder,
        session_id: sessionId,
        credits_amount: pkg.credits_amount,
        package_id: packageId,
        type: 'credit_purchase',
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  }
  
  return {
    token: transaction.token,
    url: transaction.url,
    invoice,
    payment,
  };
}

/**
 * Inicia inscripción Oneclick
 */
export async function createOneclickInscription(
  orgId: string,
  username: string,
  email: string,
  returnUrl: string
) {
  const supabase = await createClient();
  
  // Obtener organización
  const { data: org } = await supabase
    .from('organizations')
    .select('email, name')
    .eq('id', orgId)
    .single();
  
  if (!org) {
    throw new Error('Organización no encontrada');
  }
  
  // Iniciar inscripción en Transbank
  const inscription = await transbankClient.startOneclickInscription({
    username,
    email: email || org.email || '',
    response_url: returnUrl,
  });
  
  console.log('✅ [Transbank Oneclick] Inscripción iniciada:', {
    token: inscription.token,
    url: inscription.url_webpay,
  });
  
  return {
    token: inscription.token,
    url: inscription.url_webpay,
  };
}

/**
 * Crea pago con Oneclick
 */
export async function createOneclickPayment(
  orgId: string,
  packageId: string,
  tbkUser: string,
  username: string
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
    throw new Error(`Paquete no encontrado: ${pkgError?.message || 'Unknown error'}`);
  }
  
  // Obtener organización
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', orgId)
    .single();
  
  if (!org) {
    throw new Error('Organización no encontrada');
  }
  
  const countryCode = org.country || 'CL';
  const currency = getCurrencyForCountry(countryCode);
  const amount = getLocalizedPrice(pkg, countryCode);
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  const total = amount + tax;
  const transbankAmount = Math.round(total);
  
  // Crear factura
  const invoiceNumber = await generateInvoiceNumber(orgId);
  
  const { data: invoice, error: invoiceError } = await supabase
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
  
  if (invoiceError || !invoice) {
    throw new Error(`Error creando factura: ${invoiceError?.message || 'Unknown error'}`);
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
  
  // Generar buy_order único para el mall (padre) - máximo 26 caracteres
  // Formato: TP + últimos 23 caracteres del invoice.id (sin guiones)
  const invoiceIdClean = invoice.id.replace(/-/g, ''); // Remover guiones
  const buyOrder = `TP${invoiceIdClean.substring(invoiceIdClean.length - 23)}`.substring(0, 26);
  
  // Generar buy_order único para la tienda (hijo) - máximo 26 caracteres
  // Formato: ST + últimos 24 caracteres del invoice.id (sin guiones)
  const storeBuyOrder = `ST${invoiceIdClean.substring(invoiceIdClean.length - 24)}`.substring(0, 26);
  
  // Obtener commerce_code de la tienda
  const storeCommerceCode = process.env.TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE || 
                            process.env.TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE || '';
  
  if (!storeCommerceCode) {
    throw new Error('Commerce code de tienda no configurado. Configura TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE o TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE');
  }
  
  // Crear pago Oneclick en Transbank (autoriza directamente)
  const payment = await transbankClient.startOneclickPayment({
    username,
    tbk_user: tbkUser,
    buy_order: buyOrder, // Orden del mall (padre)
    details: [
      {
        commerce_code: storeCommerceCode,
        buy_order: storeBuyOrder, // Orden de la tienda (hijo)
        amount: transbankAmount,
      }
    ]
  });
  
  // La respuesta ya viene autorizada, verificar el resultado
  const paymentDetail = payment.details[0];
  const isAuthorized = paymentDetail?.response_code === 0;
  const paymentStatus = isAuthorized ? 'authorized' : 'rejected';
  
  console.log('✅ [Transbank Oneclick] Pago autorizado:', {
    buyOrder: payment.buy_order,
    transactionDate: payment.transaction_date,
    status: paymentDetail?.status,
    responseCode: paymentDetail?.response_code,
    authorizationCode: paymentDetail?.authorization_code,
    isAuthorized,
  });
  
  // Crear registro de pago en BD con status 'pending'
  // El webhook lo actualizará a 'succeeded' y agregará los créditos
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: orgId,
      invoice_id: invoice.id,
      provider: 'transbank',
      provider_payment_id: payment.buy_order, // Usar buy_order como ID
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        buy_order: payment.buy_order,
        store_buy_order: storeBuyOrder,
        tbk_user: tbkUser,
        username,
        credits_amount: pkg.credits_amount,
        package_id: packageId,
        type: 'credit_purchase',
        payment_method: 'oneclick',
        authorization_code: paymentDetail?.authorization_code,
        transaction_date: payment.transaction_date,
        accounting_date: payment.accounting_date,
        card_number: payment.card_detail?.card_number,
        response_code: paymentDetail?.response_code,
        payment_type_code: paymentDetail?.payment_type_code,
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
  }
  
  return {
    token: payment.buy_order, // Usar buy_order como token para compatibilidad
    url: '', // No hay URL, el pago ya está autorizado
    invoice,
    payment: paymentRecord,
    success: isAuthorized, // Retornar si fue autorizado o no
  };
}

/**
 * Crea pago con Oneclick para una orden
 */
export async function createOneclickPaymentForOrder(
  orderId: string,
  tbkUser: string,
  username: string
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
  
  const countryCode = org.country || 'CL';
  const currency = order.currency || getCurrencyForCountry(countryCode);
  const amount = order.amount;
  
  // Obtener datos del producto desde product_data
  const productData = order.product_data as any;
  
  console.log('💰 [Transbank Oneclick Order] Configuración de pago:', {
    countryCode,
    currency,
    amount,
    orderId,
    orderNumber: order.order_number,
    orgId: order.organization_id,
    tbkUser,
    username,
  });
  
  // Calcular impuesto
  const { data: taxRate } = await supabase.rpc('get_tax_rate', {
    country_code_param: countryCode,
  });
  
  const tax = amount * (taxRate || 0);
  const total = amount + tax;
  
  // Transbank usa CLP (moneda zero-decimal, no multiplicar por 100)
  const transbankAmount = Math.round(total);
  
  console.log('💰 [Transbank Oneclick Order] Montos calculados:', {
    amount,
    tax,
    total,
    transbankAmount,
    currency,
  });
  
  // Crear factura en BD primero
  const invoiceNumber = await generateInvoiceNumber(order.organization_id);
  
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: order.organization_id,
      invoice_number: invoiceNumber,
      status: 'open',
      type: order.product_type === 'credits' ? 'credit_purchase' : 'one_time',
      subtotal: amount,
      tax,
      total,
      currency,
      due_date: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (invoiceError || !invoice) {
    throw new Error(`Error creando factura: ${invoiceError?.message || 'Unknown error'}`);
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
      total,
      type: order.product_type,
    });
  
  // Actualizar orden con invoice_id
  await updateOrderStatus(orderId, 'pending_payment', { invoiceId: invoice.id });
  
  // Generar buy_order único para el mall (padre) - máximo 26 caracteres
  // Formato: TP + últimos 23 caracteres del invoice.id (sin guiones)
  const invoiceIdClean = invoice.id.replace(/-/g, ''); // Remover guiones
  const buyOrder = `TP${invoiceIdClean.substring(invoiceIdClean.length - 23)}`.substring(0, 26);
  
  // Generar buy_order único para la tienda (hijo) - máximo 26 caracteres
  // Formato: ST + últimos 24 caracteres del invoice.id (sin guiones)
  const storeBuyOrder = `ST${invoiceIdClean.substring(invoiceIdClean.length - 24)}`.substring(0, 26);
  
  // Obtener commerce_code de la tienda
  const storeCommerceCode = process.env.TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE || 
                            process.env.TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE || '';
  
  if (!storeCommerceCode) {
    throw new Error('Commerce code de tienda no configurado. Configura TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE o TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE');
  }
  
  // Crear pago Oneclick en Transbank (autoriza directamente)
  const payment = await transbankClient.startOneclickPayment({
    username,
    tbk_user: tbkUser,
    buy_order: buyOrder, // Orden del mall (padre)
    details: [
      {
        commerce_code: storeCommerceCode,
        buy_order: storeBuyOrder, // Orden de la tienda (hijo)
        amount: transbankAmount,
      }
    ]
  });
  
  // La respuesta ya viene autorizada, verificar el resultado
  const paymentDetail = payment.details[0];
  const isAuthorized = paymentDetail?.response_code === 0;
  const paymentStatus = isAuthorized ? 'authorized' : 'rejected';
  
  console.log('✅ [Transbank Oneclick Order] Pago autorizado:', {
    buyOrder: payment.buy_order,
    transactionDate: payment.transaction_date,
    status: paymentDetail?.status,
    responseCode: paymentDetail?.response_code,
    authorizationCode: paymentDetail?.authorization_code,
    isAuthorized,
  });
  
  // Crear registro de pago en BD con status 'pending'
  // El webhook lo actualizará a 'succeeded' y agregará los créditos
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: order.organization_id,
      invoice_id: invoice.id,
      provider: 'transbank',
      provider_payment_id: payment.buy_order, // Usar buy_order como ID
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        buy_order: payment.buy_order,
        store_buy_order: storeBuyOrder,
        tbk_user: tbkUser,
        username,
        order_id: orderId,
        order_number: order.order_number,
        product_type: order.product_type,
        product_id: order.product_id,
        ...(order.product_type === 'credits' && productData.credits_amount 
          ? { credits_amount: productData.credits_amount }
          : {}),
        type: order.product_type === 'credits' ? 'credit_purchase' : order.product_type,
        payment_method: 'oneclick',
        authorization_code: paymentDetail?.authorization_code,
        transaction_date: payment.transaction_date,
        accounting_date: payment.accounting_date,
        card_number: payment.card_detail?.card_number,
        response_code: paymentDetail?.response_code,
        payment_type_code: paymentDetail?.payment_type_code,
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
    // No fallar si hay error aquí, el webhook lo manejará
  }
  
  // Actualizar orden a 'pending_payment' - el webhook la actualizará a 'paid' cuando procese el pago
  await updateOrderStatus(orderId, 'pending_payment', { 
    invoiceId: invoice.id,
    paymentId: paymentRecord?.id 
  });
  
  return {
    token: payment.buy_order, // Usar buy_order como token para compatibilidad
    url: '', // No hay URL, el pago ya está autorizado
    invoice,
    payment: paymentRecord,
    order,
    success: isAuthorized,
  };
}

/**
 * Genera número de factura único usando función thread-safe de la BD
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
    
    if (attempt === maxAttempts - 1) {
      console.error('Error generando número de factura después de', maxAttempts, 'intentos:', error);
      throw new Error(`No se pudo generar número de factura: ${error?.message || 'Unknown error'}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
  }
  
  throw new Error('No se pudo generar número de factura después de múltiples intentos');
}

