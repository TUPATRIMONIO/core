/**
 * Configuración de países soportados por TuPatrimonio
 */

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  locale: string;
  timezone: string;
  supported: boolean;
  available: boolean; // Indica si el país está activo y operativo
  launchDate?: string; // Fecha estimada de lanzamiento (formato: 'Q1 2025', 'Marzo 2025', etc.)
}

export const SUPPORTED_COUNTRIES: Record<string, CountryConfig> = {
  cl: {
    code: 'cl',
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    locale: 'es-CL',
    timezone: 'America/Santiago',
    supported: true,
    available: true // ✅ OPERATIVO
  },
  mx: {
    code: 'mx', 
    name: 'México',
    flag: '🇲🇽',
    currency: 'MXN',
    locale: 'es-MX',
    timezone: 'America/Mexico_City',
    supported: true,
    available: false, // 🚀 PRÓXIMAMENTE
    launchDate: 'Q2 2025'
  },
  co: {
    code: 'co',
    name: 'Colombia', 
    flag: '🇨🇴',
    currency: 'COP',
    locale: 'es-CO',
    timezone: 'America/Bogota',
    supported: true,
    available: false, // 🚀 PRÓXIMAMENTE
    launchDate: 'Q2 2025'
  },
  pe: {
    code: 'pe',
    name: 'Perú',
    flag: '🇵🇪',
    currency: 'PEN',
    locale: 'es-PE',
    timezone: 'America/Lima',
    supported: true,
    available: false, // 🚀 PRÓXIMAMENTE
    launchDate: 'Q3 2025'
  },
  ar: {
    code: 'ar',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    locale: 'es-AR',
    timezone: 'America/Argentina/Buenos_Aires',
    supported: true,
    available: false, // 🚀 PRÓXIMAMENTE
    launchDate: 'Q3 2025'
  }
};

export const DEFAULT_COUNTRY = 'cl';

/**
 * Obtiene la configuración de un país
 */
export function getCountryConfig(code: string): CountryConfig | null {
  return SUPPORTED_COUNTRIES[code] || null;
}

/**
 * Obtiene todos los países soportados como array
 */
export function getSupportedCountries(): CountryConfig[] {
  return Object.values(SUPPORTED_COUNTRIES);
}

/**
 * Verifica si un país está soportado
 */
export function isCountrySupported(code: string): boolean {
  return !!SUPPORTED_COUNTRIES[code];
}

/**
 * Normaliza un código de país a nuestro formato
 */
export function normalizeCountryCode(code: string): string | null {
  const normalized = code.toLowerCase();
  return SUPPORTED_COUNTRIES[normalized] ? normalized : null;
}
