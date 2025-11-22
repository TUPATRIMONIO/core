import { createClient } from '@/lib/supabase/server';
import { checkAndRecharge } from './auto-recharge';

/**
 * Reserva créditos antes de una operación
 * Verifica automáticamente si necesita auto-recarga antes de reservar
 */
export async function reserveCredits(
  orgId: string,
  amount: number,
  serviceCode?: string,
  referenceId?: string,
  description?: string
): Promise<string> {
  const supabase = await createClient();
  
  // Obtener cuenta de créditos para verificar balance disponible
  const { data: account } = await supabase
    .from('credit_accounts')
    .select('balance, reserved_balance, auto_recharge_enabled, auto_recharge_threshold')
    .eq('organization_id', orgId)
    .single();
  
  if (account) {
    const availableBalance = account.balance - account.reserved_balance;
    const requiredBalance = amount;
    
    // Si no hay suficientes créditos disponibles, verificar auto-recarga
    if (availableBalance < requiredBalance && account.auto_recharge_enabled) {
      console.log('🔄 Créditos insuficientes, verificando auto-recarga...', {
        orgId,
        availableBalance,
        requiredBalance,
        threshold: account.auto_recharge_threshold,
      });
      
      try {
        // Intentar auto-recarga
        const rechargeExecuted = await checkAndRecharge(orgId);
        
        if (rechargeExecuted) {
          console.log('✅ Auto-recarga ejecutada, esperando procesamiento...');
          // Esperar un momento para que el webhook procese el pago
          // Nota: En producción, esto debería manejarse de forma asíncrona
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.warn('⚠️ Auto-recarga falló o no fue necesaria:', error.message);
        // Continuar con la reserva, puede que haya suficientes créditos ahora
        // o que la auto-recarga no esté configurada correctamente
      }
    }
  }
  
  // Intentar reservar créditos
  const { data, error } = await supabase.rpc('reserve_credits', {
    org_id_param: orgId,
    amount_param: amount,
    service_code_param: serviceCode || null,
    reference_id_param: referenceId || null,
    description_param: description || null,
  });
  
  if (error) {
    throw new Error(`Error reserving credits: ${error.message}`);
  }
  
  return data;
}

/**
 * Confirma uso de créditos (desbloquea y resta del balance)
 */
export async function confirmCredits(orgId: string, transactionId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('confirm_credits', {
    org_id_param: orgId,
    transaction_id_param: transactionId,
  });
  
  if (error) {
    throw new Error(`Error confirming credits: ${error.message}`);
  }
  
  return data === true;
}

/**
 * Libera créditos bloqueados (operación cancelada)
 */
export async function releaseCredits(orgId: string, transactionId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('release_credits', {
    org_id_param: orgId,
    transaction_id_param: transactionId,
  });
  
  if (error) {
    throw new Error(`Error releasing credits: ${error.message}`);
  }
  
  return data === true;
}

/**
 * Agrega créditos a una cuenta (suscripción o compra)
 */
export async function addCredits(
  orgId: string,
  amount: number,
  source: string = 'manual',
  metadata: Record<string, any> = {},
  description?: string
): Promise<string> {
  const supabase = await createClient();
  
  console.log('🔄 addCredits llamado:', {
    orgId,
    amount,
    source,
    metadata,
  });
  
  const { data, error } = await supabase.rpc('add_credits', {
    org_id_param: orgId,
    amount_param: amount,
    source_param: source,
    metadata_param: metadata,
    description_param: description || null,
  });
  
  if (error) {
    console.error('❌ Error en add_credits RPC:', {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      orgId,
      amount,
    });
    throw new Error(`Error adding credits: ${error.message}`);
  }
  
  console.log('✅ add_credits RPC exitoso:', {
    transactionId: data,
    orgId,
    amount,
  });
  
  return data;
}

/**
 * Obtiene balance disponible de una organización
 */
export async function getBalance(orgId: string): Promise<number> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_balance', {
    org_id_param: orgId,
  });
  
  if (error) {
    // Si no existe cuenta, retornar 0
    if (error.code === 'P0001' || error.message.includes('not found')) {
      return 0;
    }
    throw new Error(`Error getting balance: ${error.message}`);
  }
  
  return parseFloat(data || '0');
}

/**
 * Verifica si necesita auto-recarga
 */
export async function checkAutoRecharge(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('check_auto_recharge', {
    org_id_param: orgId,
  });
  
  if (error) {
    throw new Error(`Error checking auto-recharge: ${error.message}`);
  }
  
  return data === true;
}

/**
 * Obtiene información completa de la cuenta de créditos
 */
export async function getCreditAccount(orgId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('credit_accounts')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No existe cuenta, crear una vacía
      const { data: newAccount } = await supabase
        .from('credit_accounts')
        .insert({
          organization_id: orgId,
          balance: 0,
          reserved_balance: 0,
        })
        .select()
        .single();
      
      return newAccount;
    }
    throw new Error(`Error getting credit account: ${error.message}`);
  }
  
  return data;
}

