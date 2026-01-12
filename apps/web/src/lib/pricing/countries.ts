import { createClient } from '@/lib/supabase/server';
import { 
  getCurrencyForCountrySync as getCurrencySync,
  getDefaultCountries as getDefaults,
  type CountryConfig
} from './countries-sync';

// Re-exportar tipos y funciones síncronas para compatibilidad
export type { CountryConfig };
export { getCurrencySync as getCurrencyForCountrySync };
export { getLocalizedProductPrice, getPriceByCurrency } from './countries-sync';

/**
 * Cache en memoria para países (se actualiza en cada request)
 * En producción podría usar Redis o similar
 */
let countriesCache: CountryConfig[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la lista de países soportados desde la base de datos
 * Usa cache para evitar consultas repetidas en la misma request
 */
export async function getSupportedCountries(): Promise<CountryConfig[]> {
  const now = Date.now();
  
  // Si el cache es válido, retornarlo
  if (countriesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return countriesCache;
  }
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('supported_countries')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  
  if (error) {
    console.error('[getSupportedCountries] Error obteniendo países:', error);
    // Retornar valores por defecto si hay error
    return getDefaults();
  }
  
  countriesCache = (data || []) as CountryConfig[];
  cacheTimestamp = now;
  
  return countriesCache;
}

/**
 * Obtiene la moneda para un país
 * Primero intenta desde la BD, luego usa valores por defecto
 */
export async function getCurrencyForCountry(countryCode: string): Promise<string> {
  if (!countryCode) {
    return 'USD';
  }
  
  try {
    const countries = await getSupportedCountries();
    const country = countries.find(
      c => c.country_code.toUpperCase() === countryCode.toUpperCase()
    );
    
    if (country?.currency_code) {
      return country.currency_code;
    }
  } catch (error) {
    console.error('[getCurrencyForCountry] Error obteniendo moneda:', error);
  }
  
  // Fallback a valores por defecto
  return getCurrencySync(countryCode);
}

/**
 * Limpia el cache de países
 * Útil después de actualizar países en la BD
 */
export function clearCountriesCache(): void {
  countriesCache = null;
  cacheTimestamp = 0;
}

// Nota: Las funciones síncronas (getCurrencyForCountrySync, getLocalizedProductPrice, etc.)
// están en countries-sync.ts para permitir su uso en componentes cliente sin importar
// dependencias de server-side
