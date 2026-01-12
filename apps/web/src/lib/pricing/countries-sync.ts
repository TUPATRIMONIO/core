/**
 * Funciones síncronas para país/moneda
 * Este archivo NO importa dependencias de server-side y puede usarse en componentes cliente
 */

/**
 * Interfaz para configuración de país
 */
export interface CountryConfig {
  country_code: string;
  name: string;
  currency_code: string;
  flag_emoji?: string;
  is_active: boolean;
  display_order: number;
}

/**
 * Valores por defecto de moneda por país
 */
export function getCurrencyForCountrySync(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    CL: 'CLP',
    AR: 'ARS',
    CO: 'COP',
    MX: 'MXN',
    PE: 'PEN',
    BR: 'BRL',
    US: 'USD',
  };
  
  return currencyMap[countryCode.toUpperCase()] || 'USD';
}

/**
 * Valores por defecto de países
 */
export function getDefaultCountries(): CountryConfig[] {
  return [
    { country_code: 'CL', name: 'Chile', currency_code: 'CLP', flag_emoji: '🇨🇱', is_active: true, display_order: 10 },
    { country_code: 'AR', name: 'Argentina', currency_code: 'ARS', flag_emoji: '🇦🇷', is_active: true, display_order: 20 },
    { country_code: 'CO', name: 'Colombia', currency_code: 'COP', flag_emoji: '🇨🇴', is_active: true, display_order: 30 },
    { country_code: 'MX', name: 'México', currency_code: 'MXN', flag_emoji: '🇲🇽', is_active: true, display_order: 40 },
    { country_code: 'PE', name: 'Perú', currency_code: 'PEN', flag_emoji: '🇵🇪', is_active: true, display_order: 50 },
    { country_code: 'BR', name: 'Brasil', currency_code: 'BRL', flag_emoji: '🇧🇷', is_active: true, display_order: 60 },
    { country_code: 'US', name: 'Estados Unidos', currency_code: 'USD', flag_emoji: '🇺🇸', is_active: true, display_order: 70 },
  ];
}

/**
 * Obtiene el precio localizado de un producto según el país
 * Funciona con productos que tienen columnas price_* (como credit_packages o signing.products)
 */
export function getLocalizedProductPrice(
  product: Record<string, any>,
  countryCode: string
): number {
  if (!product || !countryCode) {
    return 0;
  }
  
  // Mapeo de país a columna de precio
  const priceKeyMap: Record<string, string> = {
    CL: 'price_clp',
    AR: 'price_ars',
    CO: 'price_cop',
    MX: 'price_mxn',
    PE: 'price_pen',
    BR: 'price_brl',
    US: 'price_usd',
  };
  
  const priceKey = priceKeyMap[countryCode.toUpperCase()] || 'price_usd';
  const price = product[priceKey];
  
  // Si no hay precio para esa moneda, usar USD como fallback
  if (price === undefined || price === null || price === 0) {
    return product.price_usd || 0;
  }
  
  return Number(price) || 0;
}

/**
 * Obtiene el precio localizado de un producto usando la moneda directamente
 * Útil cuando ya se conoce la moneda
 */
export function getPriceByCurrency(
  product: Record<string, any>,
  currencyCode: string
): number {
  if (!product || !currencyCode) {
    return 0;
  }
  
  const priceKey = `price_${currencyCode.toLowerCase()}`;
  const price = product[priceKey];
  
  // Si no hay precio para esa moneda, usar USD como fallback
  if (price === undefined || price === null || price === 0) {
    return product.price_usd || 0;
  }
  
  return Number(price) || 0;
}
