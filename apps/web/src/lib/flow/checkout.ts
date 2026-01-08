import crypto from 'crypto';

/**
 * Utilidades para interactuar con la API de Flow.cl
 * Documentación: https://developers.flow.cl/api
 */

const API_KEY = process.env.FLOW_API_KEY;
const SECRET_KEY = process.env.FLOW_SECRET_KEY;
const API_URL = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api';

/**
 * Genera la firma para una petición a Flow
 * @param params Parámetros de la petición
 * @returns Firma (s)
 */
export function generateFlowSignature(params: Record<string, any>): string {
  if (!SECRET_KEY) throw new Error('FLOW_SECRET_KEY no configurado');

  // 1. Ordenar parámetros alfabéticamente por nombre
  const keys = Object.keys(params).sort();
  
  // 2. Concatenar nombre_valor
  let toSign = '';
  for (const key of keys) {
    if (key === 's') continue;
    toSign += `${key}${params[key]}`;
  }

  // 3. Generar HMAC-SHA256 con SecretKey
  return crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex');
}

/**
 * Crea una orden de pago en Flow
 */
export async function createFlowPayment(params: {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
  subject: string;
  urlConfirmation: string;
  urlReturn: string;
  metadata?: any;
}) {
  if (!API_KEY) throw new Error('FLOW_API_KEY no configurado');

  const flowParams: Record<string, any> = {
    apiKey: API_KEY,
    commerceOrder: params.orderId,
    subject: params.subject,
    currency: params.currency || 'CLP',
    amount: params.amount,
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  };

  // Agregar firma
  flowParams.s = generateFlowSignature(flowParams);

  // Flow usa application/x-www-form-urlencoded
  const body = new URLSearchParams(flowParams).toString();

  const response = await fetch(`${API_URL}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Flow] Error creando pago:', data);
    throw new Error(data.message || 'Error al crear orden en Flow');
  }

  return {
    url: `${data.url}?token=${data.token}`,
    token: data.token,
    flowOrder: data.flowOrder,
  };
}

/**
 * Obtiene el estado de un pago en Flow
 */
export async function getFlowPaymentStatus(token: string) {
  if (!API_KEY) throw new Error('FLOW_API_KEY no configurado');

  const flowParams: Record<string, any> = {
    apiKey: API_KEY,
    token,
  };

  flowParams.s = generateFlowSignature(flowParams);

  const query = new URLSearchParams(flowParams).toString();
  const response = await fetch(`${API_URL}/payment/getStatus?${query}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener estado en Flow');
  }

  return data;
}

/**
 * Procesa la confirmación de pago (webhook) de Flow
 */
export async function handleFlowConfirmation(token: string) {
  const status = await getFlowPaymentStatus(token);
  
  // Status: 1: Pendiente, 2: Pagado, 3: Rechazado, 4: Anulado
  const success = status.status === 2;
  
  return {
    success,
    orderId: status.commerceOrder,
    amount: status.amount,
    currency: status.currency,
    status: status.status,
    raw: status,
  };
}

