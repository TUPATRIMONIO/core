/**
 * Configuración de países soportados por TuPatrimonio
 */
export const SUPPORTED_COUNTRIES = {
    cl: {
        code: 'cl',
        name: 'Chile',
        flag: '🇨🇱',
        currency: 'CLP',
        locale: 'es-CL',
        timezone: 'America/Santiago',
        supported: true
    },
    mx: {
        code: 'mx',
        name: 'México',
        flag: '🇲🇽',
        currency: 'MXN',
        locale: 'es-MX',
        timezone: 'America/Mexico_City',
        supported: true
    },
    co: {
        code: 'co',
        name: 'Colombia',
        flag: '🇨🇴',
        currency: 'COP',
        locale: 'es-CO',
        timezone: 'America/Bogota',
        supported: true
    }
};
export const DEFAULT_COUNTRY = 'cl';
/**
 * Obtiene la configuración de un país
 */
export function getCountryConfig(code) {
    return SUPPORTED_COUNTRIES[code] || null;
}
/**
 * Obtiene todos los países soportados como array
 */
export function getSupportedCountries() {
    return Object.values(SUPPORTED_COUNTRIES);
}
/**
 * Verifica si un país está soportado
 */
export function isCountrySupported(code) {
    return !!SUPPORTED_COUNTRIES[code];
}
/**
 * Normaliza un código de país a nuestro formato
 */
export function normalizeCountryCode(code) {
    const normalized = code.toLowerCase();
    return SUPPORTED_COUNTRIES[normalized] ? normalized : null;
}
