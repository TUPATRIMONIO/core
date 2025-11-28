/**
 * Interfaz base para todos los proveedores de pago
 * 
 * Esta interfaz permite unificar la lógica de pagos para cualquier proveedor,
 * eliminando la necesidad de código específico por proveedor en componentes y páginas.
 */

export interface PaymentProvider {
  /** Nombre del proveedor (ej: 'stripe', 'transbank') */
  name: string;
  
  /**
   * Crea una sesión de pago para una orden
   * Retorna la URL a la que redirigir al usuario para completar el pago
   */
  createPaymentSession(params: CreatePaymentParams): Promise<PaymentSession>;
  
  /**
   * Verifica el estado de un pago después de que el usuario regresa
   * Usado en páginas de éxito para confirmar el pago
   */
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerification>;
  
  /**
   * Procesa un webhook del proveedor
   * Maneja eventos asíncronos del proveedor (pago exitoso, fallido, etc.)
   */
  processWebhook(event: any): Promise<WebhookResult>;
}

/**
 * Parámetros para crear una sesión de pago
 */
export interface CreatePaymentParams {
  /** ID de la orden a pagar */
  orderId: string;
  /** URL a la que redirigir después del pago */
  returnUrl: string;
  /** ID de la organización */
  organizationId: string;
  /** Monto a pagar */
  amount: number;
  /** Moneda (ej: 'USD', 'CLP') */
  currency: string;
  /** Metadatos adicionales */
  metadata?: Record<string, any>;
}

/**
 * Resultado de crear una sesión de pago
 */
export interface PaymentSession {
  /** URL a la que redirigir al usuario */
  url: string;
  /** ID de la sesión en el proveedor */
  sessionId: string;
  /** Nombre del proveedor */
  provider: string;
}

/**
 * Parámetros para verificar un pago
 */
export interface VerifyPaymentParams {
  /** ID de sesión (para Stripe) */
  sessionId?: string;
  /** Token de transacción (para Transbank) */
  token?: string;
  /** ID de la orden */
  orderId: string;
  /** ID de la organización */
  organizationId: string;
  /** Parámetros adicionales del proveedor */
  [key: string]: any;
}

/**
 * Resultado de verificar un pago
 */
export interface PaymentVerification {
  /** Si la verificación fue exitosa */
  success: boolean;
  /** ID del pago en la base de datos */
  paymentId: string;
  /** Estado del pago */
  status: 'succeeded' | 'pending' | 'failed';
  /** Mensaje de error si hubo alguno */
  error?: string;
}

/**
 * Resultado de procesar un webhook
 */
export interface WebhookResult {
  /** Si el webhook se procesó exitosamente */
  success: boolean;
  /** Si el evento fue procesado (o ignorado si no aplica) */
  processed: boolean;
  /** Mensaje de error si hubo alguno */
  error?: string;
}

