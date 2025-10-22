/**
 * @tupatrimonio/location - Sistema de detección de ubicación compartido
 */
// Core classes
export { LocationManager } from './LocationManager';
// Country configuration
export { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getCountryConfig, getSupportedCountries, isCountrySupported, normalizeCountryCode } from './CountryConfig';
// React hooks
export { useLocation, useCountryPersonalization } from './hooks/useLocation';
// UI Components
export { CountrySelector } from './components/CountrySelector';
