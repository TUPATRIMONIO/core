import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Crea una notificación de billing
 */
export async function createBillingNotification(
  orgId: string,
  type: 'credits_added' | 'credits_low' | 'payment_succeeded' | 'payment_failed' | 'auto_recharge_executed' | 'auto_recharge_failed' | 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'invoice_paid' | 'invoice_overdue',
  title: string,
  message: string,
  userId?: string,
  actionUrl?: string,
  actionLabel?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const supabase = createServiceRoleClient();
  
  const { data, error } = await supabase.rpc('create_notification', {
    org_id_param: orgId,
    notification_type_param: type,
    title_param: title,
    message_param: message,
    user_id_param: userId || null,
    action_url_param: actionUrl || null,
    action_label_param: actionLabel || null,
    metadata_param: metadata || {},
  });
  
  if (error) {
    console.error('Error creating notification:', error);
    throw new Error(`Error creating notification: ${error.message}`);
  }
  
  return data;
}

/**
 * Notifica cuando se agregan créditos
 */
export async function notifyCreditsAdded(
  orgId: string,
  amount: number,
  source: string,
  invoiceId?: string
): Promise<void> {
  const title = 'Créditos agregados';
  const message = `Se agregaron ${amount.toFixed(2)} créditos a tu cuenta${source === 'credit_purchase' ? ' por compra' : source === 'subscription_monthly' ? ' por suscripción mensual' : ''}.`;
  
  await createBillingNotification(
    orgId,
    'credits_added',
    title,
    message,
    undefined, // Para toda la organización
    invoiceId ? `/billing/invoices/${invoiceId}` : '/billing',
    'Ver facturación',
    {
      amount,
      source,
      invoice_id: invoiceId,
    }
  );
}

/**
 * Notifica cuando los créditos están bajos
 */
export async function notifyCreditsLow(
  orgId: string,
  currentBalance: number,
  threshold: number
): Promise<void> {
  const title = 'Créditos bajos';
  const message = `Tu balance de créditos (${currentBalance.toFixed(2)}) está por debajo del umbral configurado (${threshold.toFixed(2)}).`;
  
  await createBillingNotification(
    orgId,
    'credits_low',
    title,
    message,
    undefined,
    '/billing/purchase-credits',
    'Comprar créditos',
    {
      current_balance: currentBalance,
      threshold,
    }
  );
}

/**
 * Notifica cuando un pago es exitoso
 */
export async function notifyPaymentSucceeded(
  orgId: string,
  amount: number,
  currency: string,
  invoiceId: string
): Promise<void> {
  const title = 'Pago exitoso';
  const message = `Tu pago de ${currency} ${amount.toFixed(2)} fue procesado exitosamente.`;
  
  await createBillingNotification(
    orgId,
    'payment_succeeded',
    title,
    message,
    undefined,
    `/billing/invoices/${invoiceId}`,
    'Ver factura',
    {
      amount,
      currency,
      invoice_id: invoiceId,
    }
  );
}

/**
 * Notifica cuando un pago falla
 */
export async function notifyPaymentFailed(
  orgId: string,
  amount: number,
  currency: string,
  invoiceId: string,
  reason?: string
): Promise<void> {
  const title = 'Pago fallido';
  const message = `Tu pago de ${currency} ${amount.toFixed(2)} no pudo ser procesado.${reason ? ` Razón: ${reason}` : ''}`;
  
  await createBillingNotification(
    orgId,
    'payment_failed',
    title,
    message,
    undefined,
    `/billing/invoices/${invoiceId}`,
    'Reintentar pago',
    {
      amount,
      currency,
      invoice_id: invoiceId,
      reason,
    }
  );
}

/**
 * Notifica cuando se ejecuta auto-recarga
 */
export async function notifyAutoRechargeExecuted(
  orgId: string,
  amount: number,
  creditsAmount: number
): Promise<void> {
  const title = 'Auto-recarga ejecutada';
  const message = `Se ejecutó una recarga automática de ${creditsAmount.toFixed(2)} créditos.`;
  
  await createBillingNotification(
    orgId,
    'auto_recharge_executed',
    title,
    message,
    undefined,
    '/billing',
    'Ver facturación',
    {
      amount,
      credits_amount: creditsAmount,
    }
  );
}

/**
 * Notifica cuando falla auto-recarga
 */
export async function notifyAutoRechargeFailed(
  orgId: string,
  reason: string
): Promise<void> {
  const title = 'Auto-recarga fallida';
  const message = `No se pudo ejecutar la recarga automática. ${reason}`;
  
  await createBillingNotification(
    orgId,
    'auto_recharge_failed',
    title,
    message,
    undefined,
    '/billing/settings',
    'Configurar auto-recarga',
    {
      reason,
    }
  );
}

/**
 * Notifica cuando se cancela una suscripción
 */
export async function notifySubscriptionCancelled(
  orgId: string,
  planName: string
): Promise<void> {
  const title = 'Suscripción cancelada';
  const message = `Tu suscripción al plan "${planName}" ha sido cancelada.`;
  
  await createBillingNotification(
    orgId,
    'subscription_cancelled',
    title,
    message,
    undefined,
    '/billing/subscription',
    'Ver suscripción',
    {
      plan_name: planName,
    }
  );
}

