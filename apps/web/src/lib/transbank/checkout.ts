import { transbankClient } from './client';
import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry, getLocalizedPrice } from '../stripe/checkout';

/**
 * Crea un pago Webpay Plus para compra de créditos
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
  
  console.log('💰 [Transbank Checkout] Configuración de pago:', {
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
    buy_order,
    session_id: sessionId,
    amount: transbankAmount,
    return_url: returnUrl,
  });
  
  console.log('✅ [Transbank Checkout] Transacción creada:', {
    token: transaction.token,
    url: transaction.url,
    buyOrder,
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
        buy_order,
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
  
  // Generar buy_order único
  const buyOrder = `TP-${invoice.id.substring(0, 20)}`;
  
  // Crear pago Oneclick en Transbank
  const payment = await transbankClient.startOneclickPayment({
    username,
    tbk_user: tbkUser,
    buy_order,
    amount: transbankAmount,
  });
  
  console.log('✅ [Transbank Oneclick] Pago iniciado:', {
    token: payment.token,
    url: payment.url_webpay,
    buyOrder,
  });
  
  // Crear registro de pago en BD
  const { data: paymentRecord, error: paymentError } = await supabase
    .from('payments')
    .insert({
      organization_id: orgId,
      invoice_id: invoice.id,
      provider: 'transbank',
      provider_payment_id: payment.token,
      amount: total,
      currency,
      status: 'pending',
      metadata: {
        buy_order,
        tbk_user: tbkUser,
        username,
        credits_amount: pkg.credits_amount,
        package_id: packageId,
        type: 'credit_purchase',
        payment_method: 'oneclick',
      },
    })
    .select()
    .single();
  
  if (paymentError) {
    console.error('Error creando registro de pago:', paymentError);
  }
  
  return {
    token: payment.token,
    url: payment.url_webpay,
    invoice,
    payment: paymentRecord,
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

