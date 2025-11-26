/**
 * Cliente dLocal Go para pagos en LATAM
 * Documentación oficial: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment
 */

const DLOCAL_API_URL = process.env.DLOCAL_API_URL || 'https://api.dlocalgo.com/v1';
const DLOCAL_SECRET_KEY = process.env.DLOCAL_SECRET_KEY || '';
const DLOCAL_API_KEY = process.env.DLOCAL_API_KEY || '';

// Variable para rastrear si ya se mostraron los warnings
let dlocalWarningsShown = false;

// Función para mostrar warnings solo cuando se use (runtime)
function checkDLocalConfig() {
  if (!dlocalWarningsShown && typeof window === 'undefined') {
    if (!DLOCAL_SECRET_KEY) {
      console.warn('DLOCAL_SECRET_KEY is not set');
    }
    if (!DLOCAL_API_KEY) {
      console.warn('DLOCAL_API_KEY is not set');
    }
    dlocalWarningsShown = true;
  }
}

export interface DLocalAddress {
  state?: string;
  city?: string;
  zip_code?: string;
  full_address?: string;
}

export interface DLocalPayer {
  id?: string;
  name?: string;
  email: string;
  phone?: string;
  document_type?: string;
  document?: string;
  user_reference?: string;
  address?: DLocalAddress;
}

export interface DLocalPaymentRequest {
  amount: number;
  currency: string; // ISO-4217 currency code in uppercase (USD, BRL, CLP, etc.)
  country?: string; // ISO 3166-1 alpha-2 country code
  order_id?: string;
  payer?: DLocalPayer;
  description?: string; // Max 100 characters
  success_url?: string; // URL where dlocalgo redirects upon successful payment
  back_url?: string; // Merchant website URL to which the client is returned
  notification_url?: string; // Notification URL for status changes
  payment_type?: string; // Comma-separated: "CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, VOUCHER"
  expiration_type?: 'MINUTES' | 'HOURS' | 'DAYS';
  expiration_value?: number;
  max_installments?: number;
  accepted_bins?: string[];
  rejected_bins?: string[];
}

export interface DLocalPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  country: string;
  description?: string;
  created_date: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REJECTED' | 'FAILED';
  order_id?: string;
  notification_url?: string;
  success_url?: string;
  back_url?: string;
  redirect_url?: string;
  merchant_checkout_token?: string;
  direct: boolean;
}

/**
 * Crea un pago en dLocal Go
 * Documentación: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/create-a-payment
 */
export async function createPayment(
  request: DLocalPaymentRequest
): Promise<DLocalPaymentResponse> {
  checkDLocalConfig();
  
  if (!DLOCAL_API_KEY || !DLOCAL_SECRET_KEY) {
    throw new Error('DLOCAL_API_KEY and DLOCAL_SECRET_KEY must be set');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`,
  };
  
  // Asegurar que currency esté en uppercase
  const requestBody = {
    ...request,
    currency: request.currency.toUpperCase(),
  };
  
  const response = await fetch(`${DLOCAL_API_URL}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`dLocal Go API error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data as DLocalPaymentResponse;
}

/**
 * Consulta estado de un pago en dLocal Go
 * Documentación: https://docs.dlocalgo.com/integration-api/welcome-to-dlocal-go-api/payments/retrieve-a-payment
 */
export async function getPaymentStatus(paymentId: string): Promise<DLocalPaymentResponse> {
  checkDLocalConfig();
  
  if (!DLOCAL_API_KEY || !DLOCAL_SECRET_KEY) {
    throw new Error('DLOCAL_API_KEY and DLOCAL_SECRET_KEY must be set');
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${DLOCAL_API_KEY}:${DLOCAL_SECRET_KEY}`,
  };
  
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
 * Obtiene métodos de pago disponibles por país
 */
export async function getAvailablePaymentMethods(countryCode: string) {
  // dLocal tiene métodos predefinidos por país
  // Esta función puede consultar la API de dLocal o usar un mapeo estático
  const methods: Record<string, string[]> = {
    CL: ['CARD', 'BANK_TRANSFER'], // Chile: Tarjeta, Transferencia
    AR: ['CARD', 'BANK_TRANSFER'], // Argentina: Tarjeta, Transferencia
    CO: ['CARD', 'BANK_TRANSFER'], // Colombia: Tarjeta, Transferencia
    MX: ['CARD', 'BANK_TRANSFER'], // México: Tarjeta, Transferencia
    PE: ['CARD', 'BANK_TRANSFER'], // Perú: Tarjeta, Transferencia
  };
  
  return methods[countryCode.toUpperCase()] || ['CARD'];
}

