import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/stripe/checkout';

/**
 * Verifica si Transbank está disponible para una organización
 * 
 * Restricciones (TODAS deben cumplirse):
 * - org_type === 'business' (B2B)
 * - country === 'CL' (Chile)
 * - currency === 'CLP' (determinado automáticamente por país)
 * 
 * @param organizationId - ID de la organización
 * @returns true si Transbank está disponible, false en caso contrario
 */
export async function isTransbankAvailable(organizationId: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Obtener datos de la organización
  const { data: org, error } = await supabase
    .from('organizations')
    .select('org_type, country')
    .eq('id', organizationId)
    .single();
  
  if (error || !org) {
    console.warn('[isTransbankAvailable] Error obteniendo organización:', error);
    return false;
  }
  
  // Verificar restricciones
  const isBusiness = org.org_type === 'business';
  const isChile = org.country === 'CL';
  const currency = getCurrencyForCountry(org.country || '');
  const isCLP = currency === 'CLP';
  
  const available = isBusiness && isChile && isCLP;
  
  console.log('[isTransbankAvailable] Verificación:', {
    organizationId,
    org_type: org.org_type,
    country: org.country,
    currency,
    isBusiness,
    isChile,
    isCLP,
    available,
  });
  
  return available;
}

/**
 * Obtiene los métodos de pago disponibles para una organización
 * 
 * @param organizationId - ID de la organización
 * @returns Array con los métodos disponibles: ['stripe'] o ['stripe', 'transbank_webpay_plus', 'transbank_oneclick']
 */
export async function getAvailablePaymentMethods(organizationId: string): Promise<string[]> {
  const availableMethods: string[] = ['stripe']; // Stripe siempre está disponible
  
  // Verificar si Transbank está disponible
  const transbankAvailable = await isTransbankAvailable(organizationId);
  
  if (transbankAvailable) {
    availableMethods.push('transbank_webpay_plus', 'transbank_oneclick');
  }
  
  return availableMethods;
}

/**
 * Verifica si un método de pago específico está disponible para una organización
 * 
 * @param organizationId - ID de la organización
 * @param method - Método a verificar: 'stripe', 'transbank_webpay_plus', 'transbank_oneclick'
 * @returns true si el método está disponible
 */
export async function isPaymentMethodAvailable(
  organizationId: string,
  method: string
): Promise<boolean> {
  // Stripe siempre está disponible
  if (method === 'stripe') {
    return true;
  }
  
  // Transbank requiere verificación
  if (method === 'transbank_webpay_plus' || method === 'transbank_oneclick') {
    return await isTransbankAvailable(organizationId);
  }
  
  // Método desconocido
  return false;
}

