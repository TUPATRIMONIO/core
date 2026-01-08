/**
 * Utilidades para interactuar con la API de DLocal Go
 * Documentación: https://docs.dlocalgo.com/
 */

const API_KEY = process.env.DLOCAL_API_KEY;
const SECRET_KEY = process.env.DLOCAL_SECRET_KEY;
const API_URL = process.env.DLOCAL_API_URL || 'https://api-sb.dlocalgo.com'; // Default sandbox

/**
 * Crea un checkout en DLocal Go
 */
export async function createDLocalCheckout(params: {
  orderId: string;
  amount: number;
  currency: string;
  country: string;
  successUrl: string;
  backUrl: string;
  notificationUrl: string;
  customer: {
    name: string;
    email: string;
    tax_id?: string;
  };
}) {
  if (!API_KEY || !SECRET_KEY) throw new Error('DLOCAL credentials no configuradas');

  const body = {
    amount: params.amount,
    currency: params.currency,
    country: params.country,
    order_id: params.orderId,
    success_url: params.successUrl,
    back_url: params.backUrl,
    notification_url: params.notificationUrl,
    payer: {
      name: params.customer.name,
      email: params.customer.email,
      document: params.customer.tax_id,
    },
  };

  const response = await fetch(`${API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}:${SECRET_KEY}`, // Ajustar según auth real de dlocal go
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[DLocal] Error creando pago:', data);
    throw new Error(data.message || 'Error al crear orden en DLocal');
  }

  return {
    url: data.redirect_url,
    id: data.id,
  };
}

/**
 * Obtiene el estado de un pago en DLocal Go
 */
export async function getDLocalPaymentStatus(paymentId: string) {
  if (!API_KEY || !SECRET_KEY) throw new Error('DLOCAL credentials no configuradas');

  const response = await fetch(`${API_URL}/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}:${SECRET_KEY}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener estado en DLocal');
  }

  return data;
}

