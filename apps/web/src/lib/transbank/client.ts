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
}

export interface OneclickPaymentStart {
  username: string;
  tbk_user: string;
  buy_order: string;
  amount: number;
}

export interface OneclickPaymentStartResponse {
  token: string;
  url_webpay: string;
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
  }

  private getBaseUrl(): string {
    return this.environment === 'production'
      ? 'https://webpay3g.transbank.cl'
      : 'https://webpay3gint.transbank.cl';
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT',
    credentials: TransbankCredentials,
    body?: any
  ): Promise<T> {
    const url = `${this.getBaseUrl()}${endpoint}`;
    
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

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transbank API error: ${response.status} - ${errorText}`);
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
   * Inicia pago con Oneclick
   */
  async startOneclickPayment(
    payment: OneclickPaymentStart
  ): Promise<OneclickPaymentStartResponse> {
    return this.makeRequest<OneclickPaymentStartResponse>(
      '/rswebpaytransaction/api/oneclick/v1.2/transactions',
      'POST',
      this.tiendaMallOneclickCredentials,
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
}

// Exportar instancia singleton
export const transbankClient = new TransbankClient();

