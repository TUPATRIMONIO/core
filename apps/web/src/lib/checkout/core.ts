import { createClient } from '@/lib/supabase/server';

export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'refunded' | 'completed';
export type ProductType = 
  | 'credits' 
  | 'electronic_signature' 
  | 'notary_service' 
  | 'company_modification' 
  | 'advisory' 
  | 'subscription';

export interface CreateOrderParams {
  orgId: string;
  productType: ProductType;
  productId?: string;
  productData: Record<string, any>;
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  expiresInHours?: number; // Default: 24 hours
}

export interface Order {
  id: string;
  organization_id: string;
  order_number: string;
  status: OrderStatus;
  product_type: ProductType;
  product_id?: string;
  product_data: Record<string, any>;
  amount: number;
  currency: string;
  payment_id?: string;
  expires_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
}

/**
 * Crea una nueva orden pendiente de pago
 */
export async function createOrder(params: CreateOrderParams): Promise<Order> {
  const supabase = await createClient();
  
  // Generar número de orden único
  const { data: orderNumber, error: orderNumberError } = await supabase.rpc('generate_order_number', {
    org_id: params.orgId
  });
  
  if (orderNumberError || !orderNumber) {
    throw new Error(`Error generando número de orden: ${orderNumberError?.message || 'Unknown error'}`);
  }
  
  // Calcular fecha de expiración (default: 24 horas)
  const expiresInHours = params.expiresInHours || 24;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiresInHours);
  
  // Crear orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: params.orgId,
      order_number: orderNumber,
      status: 'pending_payment',
      product_type: params.productType,
      product_id: params.productId || null,
      product_data: params.productData,
      amount: params.amount,
      currency: params.currency,
      expires_at: expiresAt.toISOString(),
      metadata: params.metadata || {},
    })
    .select()
    .single();
  
  if (orderError || !order) {
    throw new Error(`Error creando orden: ${orderError?.message || 'Unknown error'}`);
  }
  
  return order;
}

/**
 * Obtiene una orden por ID
 */
export async function getOrder(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrada
    }
    throw new Error(`Error obteniendo orden: ${error.message}`);
  }
  
  return order;
}

/**
 * Obtiene una orden por número de orden
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const supabase = await createClient();
  
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No encontrada
    }
    throw new Error(`Error obteniendo orden: ${error.message}`);
  }
  
  return order;
}

/**
 * Obtiene órdenes pendientes de una organización
 */
export async function getPendingOrders(orgId: string): Promise<Order[]> {
  const supabase = await createClient();
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('organization_id', orgId)
    .eq('status', 'pending_payment')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(`Error obteniendo órdenes pendientes: ${error.message}`);
  }
  
  return orders || [];
}

/**
 * Helper para registrar eventos en el historial de la orden
 */
async function logOrderEvent(
  supabase: any,
  orderId: string,
  eventType: string,
  description: string,
  metadata: Record<string, any> = {},
  userId?: string,
  fromStatus?: OrderStatus,
  toStatus?: OrderStatus
): Promise<void> {
  try {
    await supabase.rpc('log_order_event', {
      p_order_id: orderId,
      p_event_type: eventType,
      p_description: description,
      p_metadata: metadata,
      p_user_id: userId || null,
      p_from_status: fromStatus || null,
      p_to_status: toStatus || null,
    });
  } catch (error: any) {
    // No fallar si el logging falla, solo loggear el error
    console.error('[logOrderEvent] Error registrando evento:', {
      orderId,
      eventType,
      error: error?.message,
    });
  }
}

/**
 * Actualiza el estado de una orden
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  additionalData?: {
    paymentId?: string;
    supabaseClient?: any; // Cliente opcional de Supabase (para webhooks con service role)
    userId?: string; // Usuario que realiza la acción
  }
): Promise<Order> {
  // Usar cliente proporcionado o crear uno nuevo
  const supabase = additionalData?.supabaseClient || await createClient();
  
  // Obtener orden actual para comparar estados
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status, order_number')
    .eq('id', orderId)
    .single();
  
  const oldStatus = currentOrder?.status as OrderStatus | undefined;
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (additionalData?.paymentId) {
    updateData.payment_id = additionalData.paymentId;
  }
  
  const { data: order, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error || !order) {
    console.error('[updateOrderStatus] Error actualizando orden:', {
      orderId,
      status,
      error: error?.message,
      code: error?.code,
      details: error,
    });
    throw new Error(`Error actualizando orden: ${error?.message || 'Unknown error'}`);
  }
  
  // El trigger ya registra automáticamente el cambio de estado con descripción amigable
  // No necesitamos registrar eventos adicionales aquí
  
  console.log('[updateOrderStatus] Orden actualizada exitosamente:', {
    orderId,
    orderNumber: order.order_number,
    newStatus: status,
  });
  
  // Si el nuevo estado es 'completed', procesar emisión de documentos
  if (status === 'completed') {
    try {
      console.log('[updateOrderStatus] Orden completada, procesando emisión de documento...');
      
      // Dar tiempo al trigger para crear la emission_request
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Llamar al procesador SOLO para esta orden específica (no todas las pendientes)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/invoicing/process-request?order_id=${orderId}`, {
        method: 'GET',
        headers: { 'X-Internal-Request': 'true' },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[updateOrderStatus] Emisión procesada:', result);
      }
    } catch (error: any) {
      console.warn('[updateOrderStatus] Error procesando emisión (no crítico):', error.message);
      // No fallar si la emisión falla - se puede procesar después manualmente
    }
  }
  
  // Disparar evento para actualizar carrito inmediatamente (solo en cliente)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('order:status-updated', {
      detail: { orderId, status }
    }));
  }
  
  return order;
}

/**
 * Marca órdenes expiradas como canceladas
 * Útil para ejecutar periódicamente (ej: cron job)
 */
export async function expireOldOrders(): Promise<number> {
  const supabase = await createClient();
  
  const { data: expiredOrders, error: selectError } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('status', 'pending_payment')
    .lt('expires_at', new Date().toISOString());
  
  if (selectError) {
    throw new Error(`Error buscando órdenes expiradas: ${selectError.message}`);
  }
  
  if (!expiredOrders || expiredOrders.length === 0) {
    return 0;
  }
  
  // Los eventos de cancelación se registrarán automáticamente cuando se actualice el estado
  // No necesitamos registrar eventos de expiración por separado
  
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', expiredOrders.map(o => o.id));
  
  if (updateError) {
    throw new Error(`Error cancelando órdenes expiradas: ${updateError.message}`);
  }
  
  return expiredOrders.length;
}

/**
 * Recupera una orden por número (útil para emails de seguimiento)
 */
export async function recoverOrder(orderNumber: string): Promise<Order | null> {
  return getOrderByNumber(orderNumber);
}

/**
 * Verifica si una orden está expirada
 */
export function isOrderExpired(order: Order): boolean {
  if (!order.expires_at) {
    return false;
  }
  
  return new Date(order.expires_at) < new Date();
}

/**
 * Verifica si una orden puede ser pagada (no expirada y pendiente)
 */
export function canPayOrder(order: Order): boolean {
  if (order.status !== 'pending_payment') {
    return false;
  }
  
  if (isOrderExpired(order)) {
    return false;
  }
  
  return true;
}

