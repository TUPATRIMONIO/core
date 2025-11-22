import { createClient } from '@/lib/supabase/server';

/**
 * Reserva créditos antes de una operación
 */
export async function reserveCredits(
  orgId: string,
  amount: number,
  serviceCode?: string,
  referenceId?: string,
  description?: string
): Promise<string> {
  const supabase = await createClient();
  
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
  
  const { data, error } = await supabase.rpc('add_credits', {
    org_id_param: orgId,
    amount_param: amount,
    source_param: source,
    metadata_param: metadata,
    description_param: description || null,
  });
  
  if (error) {
    throw new Error(`Error adding credits: ${error.message}`);
  }
  
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

