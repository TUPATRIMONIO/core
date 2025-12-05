import { getPaymentProvider } from './provider-factory';
import { PaymentVerification, VerifyPaymentParams } from './adapters/base';
import { getOrder } from '@/lib/checkout/core';
import { createClient } from '@/lib/supabase/server';

/**
 * Verifica el estado de un pago para una orden usando el proveedor correspondiente
 * 
 * Esta función unifica la lógica de verificación de pagos, permitiendo
 * verificar cualquier proveedor con la misma interfaz.
 * 
 * @param orderId - ID de la orden
 * @param provider - Nombre del proveedor ('stripe', 'transbank', etc.)
 * @param sessionData - Datos de la sesión del proveedor (sessionId, token, etc.)
 * @returns Resultado de la verificación del pago
 */
export async function verifyPaymentForOrder(
  orderId: string,
  provider: string,
  sessionData: Record<string, any>
): Promise<PaymentVerification> {
  // Obtener orden para validar organización
  const order = await getOrder(orderId);
  
  if (!order) {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: 'Orden no encontrada',
    };
  }
  
  // Obtener proveedor de pago
  let paymentProvider;
  try {
    paymentProvider = getPaymentProvider(provider);
  } catch (error: any) {
    return {
      success: false,
      paymentId: '',
      status: 'failed',
      error: error.message || 'Proveedor de pago no válido',
    };
  }
  
  // Construir parámetros de verificación
  const verifyParams: VerifyPaymentParams = {
    orderId,
    organizationId: order.organization_id,
    ...sessionData, // Incluir todos los datos de sesión (sessionId, token, type, etc.)
  };
  
  // Verificar pago usando el proveedor
  return await paymentProvider.verifyPayment(verifyParams);
}

/**
 * Obtiene información del pago desde la base de datos
 * 
 * @param paymentId - ID del pago en la base de datos
 * @returns Datos del pago
 */
export async function getPaymentById(paymentId: string) {
  const supabase = await createClient();
  
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();
  
  if (error || !payment) {
    return null;
  }
  
  return payment;
}

