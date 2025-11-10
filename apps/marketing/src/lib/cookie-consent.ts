/**
 * Sistema de Gestión de Consentimiento de Cookies
 * Cumple con RGPD - localStorage para preferencias del usuario
 */

export interface CookieConsent {
  essential: boolean;    // Siempre true - necesarias para funcionamiento
  analytics: boolean;    // Google Analytics
  marketing: boolean;    // Futuras cookies de marketing
  timestamp: number;     // Cuándo se guardó el consentimiento
}

const STORAGE_KEY = 'tp-cookie-consent';

/**
 * Obtiene el consentimiento guardado en localStorage
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as CookieConsent;
    
    // Validar que tenga la estructura correcta
    if (
      typeof parsed.essential === 'boolean' &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean' &&
      typeof parsed.timestamp === 'number'
    ) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('Error al leer consentimiento de cookies:', error);
    return null;
  }
}

/**
 * Guarda el consentimiento en localStorage
 */
export function setCookieConsent(consent: Omit<CookieConsent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const consentWithTimestamp: CookieConsent = {
      ...consent,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentWithTimestamp));
    
    // Disparar evento personalizado para que otros componentes reaccionen
    window.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: consentWithTimestamp,
    }));
  } catch (error) {
    console.error('Error al guardar consentimiento de cookies:', error);
  }
}

/**
 * Elimina el consentimiento (resetear preferencias)
 */
export function clearCookieConsent(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    
    // Disparar evento
    window.dispatchEvent(new CustomEvent('cookieConsentChange', {
      detail: null,
    }));
  } catch (error) {
    console.error('Error al limpiar consentimiento de cookies:', error);
  }
}

/**
 * Verifica si el usuario ya dio su consentimiento
 */
export function hasConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Verifica si analytics está habilitado
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

/**
 * Preset: Aceptar todas las cookies
 */
export function acceptAllCookies(): void {
  setCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Preset: Solo cookies esenciales
 */
export function acceptEssentialOnly(): void {
  setCookieConsent({
    essential: true,
    analytics: false,
    marketing: false,
  });
}

