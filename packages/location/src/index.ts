/**
 * @tupatrimonio/location - Sistema de detección de ubicación compartido
 */

// Core classes
export { LocationManager } from './LocationManager';
export type { LocationResult, LocationSource } from './LocationManager';

// Country configuration
export { 
  SUPPORTED_COUNTRIES, 
  DEFAULT_COUNTRY,
  getCountryConfig,
  getSupportedCountries,
  isCountrySupported,
  normalizeCountryCode
} from './CountryConfig';
export type { CountryConfig } from './CountryConfig';

// React hooks
export { useLocation, useCountryPersonalization } from './hooks/useLocation';

// UI Components
export { CountrySelector } from './components/CountrySelector';
export type { CountrySelectorProps } from './components/CountrySelector';
