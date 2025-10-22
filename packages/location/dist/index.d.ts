/**
 * @tupatrimonio/location - Sistema de detección de ubicación compartido
 */
export { LocationManager } from './LocationManager';
export type { LocationResult, LocationSource } from './LocationManager';
export { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, getCountryConfig, getSupportedCountries, isCountrySupported, normalizeCountryCode } from './CountryConfig';
export type { CountryConfig } from './CountryConfig';
export { useLocation, useCountryPersonalization } from './hooks/useLocation';
export { CountrySelector } from './components/CountrySelector';
export type { CountrySelectorProps } from './components/CountrySelector';
