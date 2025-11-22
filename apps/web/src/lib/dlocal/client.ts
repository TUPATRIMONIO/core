/**
 * Cliente dLocal Go para pagos en LATAM
 */

if (!process.env.DLOCAL_SECRET_KEY) {
  console.warn('DLOCAL_SECRET_KEY is not set');
}

if (!process.env.DLOCAL_API_KEY) {
  console.warn('DLOCAL_API_KEY is not set');
}

const DLOCAL_API_URL = process.env.DLOCAL_API_URL || 'https://api.dlocal.com';
const DLOCAL_SECRET_KEY = process.env.DLOCAL_SECRET_KEY || '';
const DLOCAL_API_KEY = process.env.DLOCAL_API_KEY || '';

export interface DLocalPaymentRequest {
  amount: number;
  currency: string;
  country: string;
  payment_method_id: string;
  payment_method_flow: 'REDIRECT' | 'DIRECT';
  payer: {
    name?: string;
    email: string;
    document?: string;
    user_reference?: string;
  };
  order_id?: string;
  description?: string;
  notification_url?: string;
  callback_url?: string;
  back_url?: string;
}

export interface DLocalPaymentResponse {
  id: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REJECTED' | 'FAILED';
  amount: number;
  currency: string;
  payment_method_id: string;
  payment_method_type: string;
  country: string;
  redirect_url?: string;
  created_date: string;
  approved_date?: string;
}

/**
 * Genera firma de autenticación para dLocal Go
 * Nota: La firma puede variar según la versión de la API
 * Consulta la documentación oficial para el formato exacto
 */
function generateSignature(
  apiKey: string,
  transactionId: string,
  secretKey: string
): string {
  // dLocal Go puede usar SHA256(api_key + transaction_id + secret_key)
  // O algún otro formato - ajustar según documentación oficial
  const crypto = require('crypto');
  const data = `${apiKey}${transactionId}${secretKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Crea un pago en dLocal Go
 * 
 * IMPORTANTE: El formato de autenticación puede variar según la versión de la API de dLocal Go.
 * Consulta la documentación oficial en: https://helpcenter.dlocalgo.com
 * 
 * Formatos comunes de autenticación:
 * 1. Headers personalizados: X-API-Key y X-Secret-Key (implementado por defecto)
 * 2. Authorization Bearer: Authorization: Bearer {API_KEY}
 * 3. Basic Auth: Authorization: Basic {base64(api_key:secret_key)}
 * 4. Formato específico de dLocal: Authorization: dlocal {api_key}:{secret_key}
 */
export async function createPayment(
  request: DLocalPaymentRequest
): Promise<DLocalPaymentResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // IMPLEMENTACIÓN ACTUAL: Headers personalizados (ajustar según documentación oficial)
  // Si dLocal Go usa otro formato, descomenta la opción correcta y comenta esta:
  headers['X-API-Key'] = DLOCAL_API_KEY;
  headers['X-Secret-Key'] = DLOCAL_SECRET_KEY;
  
  // OPCIONES ALTERNATIVAS (descomentar según la documentación oficial):
  // Opción 1: Bearer token
  // headers['Authorization'] = `Bearer ${DLOCAL_API_KEY}`;
  
  // Opción 2: Basic Auth
  // headers['Authorization'] = `Basic ${Buffer.from(`${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`).toString('base64')}`;
  
  // Opción 3: Formato específico dLocal
  // headers['Authorization'] = `dlocal ${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`;
  
  const response = await fetch(`${DLOCAL_API_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`dLocal Go API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  // Generar firma para verificación de webhook
  const signature = generateSignature(
    DLOCAL_API_KEY,
    data.id,
    DLOCAL_SECRET_KEY
  );
  
  return {
    ...data,
    _signature: signature, // Guardar para verificación de webhook
  } as DLocalPaymentResponse & { _signature: string };
}

/**
 * Consulta estado de un pago en dLocal Go
 */
export async function getPaymentStatus(paymentId: string): Promise<DLocalPaymentResponse> {
  const headers: Record<string, string> = {};
  
  // Usar los mismos headers que en createPayment
  headers['X-API-Key'] = DLOCAL_API_KEY;
  headers['X-Secret-Key'] = DLOCAL_SECRET_KEY;
  
  const response = await fetch(`${DLOCAL_API_URL}/payments/${paymentId}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`dLocal Go API error: ${error.message || response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Verifica firma de webhook de dLocal Go
 */
export function verifyWebhookSignature(
  signature: string,
  paymentId: string
): boolean {
  const expectedSignature = generateSignature(
    DLOCAL_API_KEY,
    paymentId,
    DLOCAL_SECRET_KEY
  );
  
  return signature.toLowerCase() === expectedSignature.toLowerCase();
}

/**
 * Obtiene métodos de pago disponibles por país
 */
export async function getAvailablePaymentMethods(countryCode: string) {
  // dLocal tiene métodos predefinidos por país
  // Esta función puede consultar la API de dLocal o usar un mapeo estático
  const methods: Record<string, string[]> = {
    CL: ['CARD', 'BANK_TRANSFER', 'CASH'], // Chile: Tarjeta, Transferencia, Efectivo (Khipu)
    AR: ['CARD', 'BANK_TRANSFER', 'CASH'], // Argentina: Tarjeta, Transferencia, Efectivo (Rapipago, Pago Fácil)
    CO: ['CARD', 'BANK_TRANSFER'], // Colombia: Tarjeta, Transferencia
    MX: ['CARD', 'BANK_TRANSFER', 'CASH'], // México: Tarjeta, Transferencia, Efectivo (OXXO)
    PE: ['CARD', 'BANK_TRANSFER'], // Perú: Tarjeta, Transferencia
  };
  
  return methods[countryCode.toUpperCase()] || ['CARD'];
}

