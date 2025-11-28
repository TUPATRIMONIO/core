/**
 * Cliente para comunicación con API de Transbank
 * Soporta Webpay Plus y Oneclick
 */

export type TransbankEnvironment = 'integration' | 'production';

export interface TransbankCredentials {
  commerceCode: string; // El commerce_code es el mismo que api_key_id
  apiKeySecret: string;
}

export interface WebpayPlusTransaction {
  buy_order: string;
  session_id: string;
  amount: number;
  return_url: string;
}

export interface WebpayPlusCreateResponse {
  token: string;
  url: string;
}

export interface WebpayPlusCommitResponse {
  vci?: string;
  amount: number;
  status: string;
  buy_order: string;
  session_id: string;
  card_detail: {
    card_number: string;
  };
  accounting_date: string;
  transaction_date: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_amount?: number;
  installments_number?: number;
  balance?: number;
}

export interface OneclickInscriptionStart {
  username: string;
  email: string;
  response_url: string;
}

export interface OneclickInscriptionStartResponse {
  token: string;
  url_webpay: string;
}

export interface OneclickInscriptionFinishResponse {
  response_code: number;
  tbk_user: string;
  username: string;
  authorization_code: string;
  card_type?: string;
  card_number?: string;
}

export interface OneclickInscriptionRemove {
  tbk_user: string;
  username: string;
}

export interface OneclickPaymentDetail {
  commerce_code: string;
  buy_order: string;
  amount: number;
  installments_number?: number;
}

export interface OneclickPaymentStart {
  username: string;
  tbk_user: string;
  buy_order: string; // Orden de compra del mall (padre)
  details: OneclickPaymentDetail[]; // Array con las transacciones de cada tienda
}

export interface OneclickPaymentDetailResponse {
  amount: number;
  status: string;
  authorization_code: string;
  payment_type_code: string;
  response_code: number;
  installments_number: number;
  commerce_code: string;
  buy_order: string;
  balance?: number;
}

export interface OneclickPaymentStartResponse {
  buy_order: string;
  card_detail: {
    card_number: string;
  };
  accounting_date: string;
  transaction_date: string;
  details: OneclickPaymentDetailResponse[];
}

export interface OneclickPaymentFinishResponse {
  response_code: number;
  buy_order: string;
  amount: number;
  authorization_code: string;
  transaction_date: string;
}

class TransbankClient {
  private environment: TransbankEnvironment;
  private webpayPlusCredentials: TransbankCredentials;
  private oneclickCredentials: TransbankCredentials;
  private tiendaMallOneclickCredentials: TransbankCredentials;

  constructor() {
    this.environment = (process.env.TRANSBANK_ENVIRONMENT as TransbankEnvironment) || 'integration';
    
    // Credenciales Webpay Plus
    this.webpayPlusCredentials = {
      commerceCode: process.env.TRANSBANK_WEBPAY_PLUS_COMMERCE_CODE || '',
      apiKeySecret: process.env.TRANSBANK_WEBPAY_PLUS_API_KEY_SECRET || '',
    };
    
    // Validar credenciales en desarrollo
    if (process.env.NODE_ENV === 'development') {
      if (!this.webpayPlusCredentials.commerceCode || !this.webpayPlusCredentials.apiKeySecret) {
        console.warn('⚠️ [Transbank] Credenciales Webpay Plus no configuradas');
      } else {
        console.log('✅ [Transbank] Entorno:', this.environment);
        console.log('✅ [Transbank] Commerce Code configurado:', this.webpayPlusCredentials.commerceCode.substring(0, 10) + '...');
      }
    }

    // Credenciales Mall Oneclick
    this.oneclickCredentials = {
      commerceCode: process.env.TRANSBANK_MALL_ONECLICK_COMMERCE_CODE || '',
      apiKeySecret: process.env.TRANSBANK_MALL_ONECLICK_API_KEY_SECRET || '',
    };

    // Credenciales Tienda Mall Oneclick
    this.tiendaMallOneclickCredentials = {
      commerceCode: process.env.TRANSBANK_TIENDA_MALL_ONECLICK_COMMERCE_CODE || '',
      apiKeySecret: process.env.TRANSBANK_TIENDA_MALL_ONECLICK_API_KEY_SECRET || '',
    };

    // Validar credenciales Tienda Mall Oneclick en desarrollo
    if (process.env.NODE_ENV === 'development') {
      if (!this.tiendaMallOneclickCredentials.commerceCode || !this.tiendaMallOneclickCredentials.apiKeySecret) {
        console.warn('⚠️ [Transbank] Credenciales Tienda Mall Oneclick no configuradas');
      } else {
        console.log('✅ [Transbank] Tienda Mall Oneclick Commerce Code configurado:', this.tiendaMallOneclickCredentials.commerceCode.substring(0, 10) + '...');
      }
    }
  }

  private getBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://webpay3g.transbank.cl'
      : 'https://webpay3gint.transbank.cl';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    credentials: TransbankCredentials,
    body?: any
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
    // Validar credenciales antes de hacer la petición
    if (!credentials.commerceCode || !credentials.apiKeySecret) {
      throw new Error(`Credenciales de Transbank no configuradas para endpoint: ${endpoint}. Commerce Code: ${credentials.commerceCode ? 'configurado' : 'FALTANTE'}, API Key Secret: ${credentials.apiKeySecret ? 'configurado' : 'FALTANTE'}`);
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Tbk-Api-Key-Id': credentials.commerceCode, // El commerce_code es el mismo que api_key_id
      'Tbk-Api-Key-Secret': credentials.apiKeySecret,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    console.log('📡 [Transbank API Request]', {
      method,
      endpoint,
      url,
      commerceCode: credentials.commerceCode.substring(0, 10) + '...',
      hasBody: !!body,
      environment: this.environment,
    });

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Transbank API Error]', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorText,
        commerceCode: credentials.commerceCode.substring(0, 10) + '...',
      });
      throw new Error(`Transbank API error: ${response.status} - ${errorText}`);
    }

    // DELETE devuelve 204 sin cuerpo
    if (method === 'DELETE' && response.status === 204) {
      return undefined as T;
    }

    // Si no hay contenido, retornar undefined
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }

    return response.json();
  }

  /**
   * Crea una transacción Webpay Plus
   */
  async createWebpayPlusTransaction(
    transaction: WebpayPlusTransaction
  ): Promise<WebpayPlusCreateResponse> {
    return this.makeRequest<WebpayPlusCreateResponse>(
      '/rswebpaytransaction/api/webpay/v1.2/transactions',
      'POST',
      this.webpayPlusCredentials,
      transaction
    );
  }

  /**
   * Confirma una transacción Webpay Plus
   */
  async commitWebpayPlusTransaction(
    token: string
  ): Promise<WebpayPlusCommitResponse> {
    return this.makeRequest<WebpayPlusCommitResponse>(
      `/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
      'PUT',
      this.webpayPlusCredentials
    );
  }

  /**
   * Consulta el estado de una transacción Webpay Plus
   */
  async getWebpayPlusTransactionStatus(
    token: string
  ): Promise<WebpayPlusCommitResponse> {
    return this.makeRequest<WebpayPlusCommitResponse>(
      `/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`,
      'GET',
      this.webpayPlusCredentials
    );
  }

  /**
   * Inicia inscripción Oneclick
   */
  async startOneclickInscription(
    inscription: OneclickInscriptionStart
  ): Promise<OneclickInscriptionStartResponse> {
    return this.makeRequest<OneclickInscriptionStartResponse>(
      '/rswebpaytransaction/api/oneclick/v1.2/inscriptions',
      'POST',
      this.oneclickCredentials,
      inscription
    );
  }

  /**
   * Finaliza inscripción Oneclick
   */
  async finishOneclickInscription(
    token: string
  ): Promise<OneclickInscriptionFinishResponse> {
    return this.makeRequest<OneclickInscriptionFinishResponse>(
      `/rswebpaytransaction/api/oneclick/v1.2/inscriptions/${token}`,
      'PUT',
      this.oneclickCredentials
    );
  }

  /**
   * Inicia pago con Oneclick (autoriza directamente según documentación)
   */
  async startOneclickPayment(
    payment: OneclickPaymentStart
  ): Promise<OneclickPaymentStartResponse> {
    // Usar credenciales del Mall Oneclick (las mismas que para inscripción)
    if (!this.oneclickCredentials.commerceCode || !this.oneclickCredentials.apiKeySecret) {
      throw new Error('Credenciales de Mall Oneclick no configuradas. Verifica las variables de entorno TRANSBANK_MALL_ONECLICK_COMMERCE_CODE y TRANSBANK_MALL_ONECLICK_API_KEY_SECRET');
    }

    console.log('🔐 [Transbank Oneclick Payment] Usando credenciales Mall:', {
      commerceCode: this.oneclickCredentials.commerceCode.substring(0, 10) + '...',
      environment: this.environment,
      buyOrder: payment.buy_order,
      detailsCount: payment.details.length,
    });

    return this.makeRequest<OneclickPaymentStartResponse>(
      '/rswebpaytransaction/api/oneclick/v1.2/transactions',
      'POST',
      this.oneclickCredentials, // Usar credenciales del Mall Oneclick
      payment
    );
  }

  /**
   * Confirma pago con Oneclick
   */
  async commitOneclickPayment(
    token: string
  ): Promise<OneclickPaymentFinishResponse> {
    return this.makeRequest<OneclickPaymentFinishResponse>(
      `/rswebpaytransaction/api/oneclick/v1.2/transactions/${token}`,
      'PUT',
      this.tiendaMallOneclickCredentials
    );
  }

  /**
   * Consulta estado de pago Oneclick
   */
  async getOneclickPaymentStatus(
    token: string
  ): Promise<OneclickPaymentFinishResponse> {
    return this.makeRequest<OneclickPaymentFinishResponse>(
      `/rswebpaytransaction/api/oneclick/v1.2/transactions/${token}`,
      'GET',
      this.tiendaMallOneclickCredentials
    );
  }

  /**
   * Elimina una inscripción Oneclick
   */
  async removeOneclickInscription(
    removeData: OneclickInscriptionRemove
  ): Promise<void> {
    const response = await this.makeRequest<any>(
      '/rswebpaytransaction/api/oneclick/v1.2/inscriptions',
      'DELETE',
      this.oneclickCredentials,
      removeData
    );
    // La respuesta es 204 sin cuerpo, así que no retornamos nada
    return;
  }
}

// Exportar instancia singleton
export const transbankClient = new TransbankClient();

