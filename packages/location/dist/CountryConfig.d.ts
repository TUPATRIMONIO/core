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
    available: boolean;
    launchDate?: string;
}
export declare const SUPPORTED_COUNTRIES: Record<string, CountryConfig>;
export declare const DEFAULT_COUNTRY = "cl";
/**
 * Obtiene la configuración de un país
 */
export declare function getCountryConfig(code: string): CountryConfig | null;
/**
 * Obtiene todos los países soportados como array
 */
export declare function getSupportedCountries(): CountryConfig[];
/**
 * Verifica si un país está soportado
 */
export declare function isCountrySupported(code: string): boolean;
/**
 * Normaliza un código de país a nuestro formato
 */
export declare function normalizeCountryCode(code: string): string | null;
