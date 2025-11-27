import { createClient } from '@/lib/supabase/server';
import { getOrderByNumber } from './core';
import crypto from 'crypto';

/**
 * Genera un token único para recuperación de orden
 * El token se almacena en metadata de la orden
 */
export async function generateRecoveryToken(orderId: string): Promise<string> {
  const supabase = await createClient();
  
  // Generar token único usando crypto
  const token = crypto.randomBytes(32).toString('hex');
  
  // Obtener orden actual
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('metadata')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    throw new Error(`Orden no encontrada: ${orderError?.message || 'Unknown error'}`);
  }
  
  // Guardar token en metadata con expiración (7 días)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const updatedMetadata = {
    ...order.metadata,
    recovery_token: token,
    recovery_token_expires_at: expiresAt.toISOString(),
  };
  
  const { error: updateError } = await supabase
    .from('orders')
    .update({ metadata: updatedMetadata })
    .eq('id', orderId);
  
  if (updateError) {
    throw new Error(`Error guardando token de recuperación: ${updateError.message}`);
  }
  
  return token;
}

/**
 * Valida un token de recuperación y retorna el orderId
 */
export async function validateRecoveryToken(token: string): Promise<string | null> {
  const supabase = await createClient();
  
  // Buscar orden con este token en metadata
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, metadata')
    .eq('status', 'pending_payment'); // Solo órdenes pendientes pueden recuperarse
  
  if (error) {
    throw new Error(`Error buscando orden con token: ${error.message}`);
  }
  
  if (!orders || orders.length === 0) {
    return null;
  }
  
  // Buscar orden con token válido
  for (const order of orders) {
    const metadata = order.metadata as any;
    
    if (metadata?.recovery_token === token) {
      // Verificar expiración
      if (metadata?.recovery_token_expires_at) {
        const expiresAt = new Date(metadata.recovery_token_expires_at);
        if (expiresAt < new Date()) {
          // Token expirado
          continue;
        }
      }
      
      return order.id;
    }
  }
  
  return null;
}

/**
 * Envía email de recuperación de carrito
 * Nota: Esta función debería integrarse con el sistema de notificaciones existente
 */
export async function sendCartRecoveryEmail(orderId: string): Promise<void> {
  const supabase = await createClient();
  
  // Obtener orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      organization:organizations (
        id,
        email,
        name
      )
    `)
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    throw new Error(`Orden no encontrada: ${orderError?.message || 'Unknown error'}`);
  }
  
  // Generar token de recuperación
  const token = await generateRecoveryToken(orderId);
  
  // Construir URL de recuperación
  const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/recover/${token}`;
  
  // TODO: Integrar con sistema de notificaciones existente
  // Por ahora solo logueamos
  console.log('📧 [Cart Recovery] Email de recuperación:', {
    orderId,
    orderNumber: order.order_number,
    orgEmail: (order as any).organization?.email,
    recoveryUrl,
  });
  
  // Aquí deberías llamar a tu sistema de notificaciones
  // Ejemplo:
  // await sendEmail({
  //   to: order.organization.email,
  //   subject: 'Recupera tu compra pendiente',
  //   template: 'cart-recovery',
  //   data: {
  //     orderNumber: order.order_number,
  //     recoveryUrl,
  //     expiresAt: order.expires_at,
  //   },
  // });
}

/**
 * Elimina token de recuperación usado (opcional, para seguridad)
 */
export async function invalidateRecoveryToken(orderId: string): Promise<void> {
  const supabase = await createClient();
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('metadata')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    return; // No hacer nada si no existe
  }
  
  const metadata = order.metadata as any;
  if (metadata?.recovery_token) {
    const updatedMetadata = { ...metadata };
    delete updatedMetadata.recovery_token;
    delete updatedMetadata.recovery_token_expires_at;
    
    await supabase
      .from('orders')
      .update({ metadata: updatedMetadata })
      .eq('id', orderId);
  }
}

