import { createClient } from '@/lib/supabase/server';
import { getCurrencyForCountry } from '@/lib/stripe/checkout';

export interface PaymentConfig {
  providers: string[];
  documentTypes: ('boleta_electronica' | 'factura_electronica' | 'stripe_invoice')[];
  country: string;
  orgType: string;
  currency: string;
}

/**
 * Obtiene la configuración de pagos disponible para una organización
 * basada en su país y tipo.
 * 
 * @param organizationId - ID de la organización
 * @param preferredCurrency - Moneda preferida (opcional). Si se proporciona, se usará en lugar de derivarla del país.
 */
export async function getPaymentConfig(
  organizationId: string,
  preferredCurrency?: string
): Promise<PaymentConfig> {
  const supabase = await createClient();
  
  const { data: org, error } = await supabase
    .from('organizations')
    .select('org_type, country')
    .eq('id', organizationId)
    .single();
  
  if (error || !org) {
    console.warn('[getPaymentConfig] Error obteniendo organización:', error);
    return {
      providers: ['stripe'],
      documentTypes: ['stripe_invoice'],
      country: 'US',
      orgType: 'personal',
      currency: preferredCurrency || 'USD'
    };
  }

  const country = org.country || 'CL';
  const orgType = org.org_type || 'personal';
  // Usar moneda preferida si está disponible, sino derivarla del país
  const currency = preferredCurrency || getCurrencyForCountry(country);
  
  const isChile = country === 'CL';
  const isBusiness = orgType === 'business';

  // Lógica de proveedores
  let providers: string[] = [];
  let documentTypes: ('boleta_electronica' | 'factura_electronica' | 'stripe_invoice')[] = [];

  if (isChile) {
    if (isBusiness) {
      // Chile + Business: Transbank (Webpay/Oneclick), Flow
      providers = ['transbank', 'flow'];
      documentTypes = ['boleta_electronica', 'factura_electronica'];
    } else {
      // Chile + Personal: Stripe, DLocalGo
      providers = ['stripe', 'dlocalgo'];
      documentTypes = ['stripe_invoice'];
    }
  } else {
    // Otros países: Stripe, DLocalGo
    providers = ['stripe', 'dlocalgo'];
    documentTypes = ['stripe_invoice'];
  }

  return {
    providers,
    documentTypes,
    country,
    orgType,
    currency
  };
}

/**
 * Verifica si Transbank está disponible para una organización
 * (Mantener por compatibilidad, pero preferir getPaymentConfig)
 */
export async function isTransbankAvailable(organizationId: string): Promise<boolean> {
  const config = await getPaymentConfig(organizationId);
  return config.providers.includes('transbank');
}

/**
 * Obtiene los métodos de pago disponibles para una organización
 */
export async function getAvailablePaymentMethods(organizationId: string): Promise<string[]> {
  const config = await getPaymentConfig(organizationId);
  return config.providers;
}

/**
 * Verifica si un método de pago específico está disponible para una organización
 */
export async function isPaymentMethodAvailable(
  organizationId: string,
  method: string
): Promise<boolean> {
  const config = await getPaymentConfig(organizationId);
  
  if (method === 'stripe') return config.providers.includes('stripe');
  if (method === 'transbank' || method === 'transbank_webpay_plus' || method === 'transbank_oneclick') {
    return config.providers.includes('transbank');
  }
  if (method === 'flow') return config.providers.includes('flow');
  if (method === 'dlocalgo') return config.providers.includes('dlocalgo');
  
  return false;
}
