'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CookieConsent,
  getCookieConsent,
  setCookieConsent,
  clearCookieConsent,
  acceptAllCookies as acceptAllUtil,
  acceptEssentialOnly as acceptEssentialUtil,
  hasConsent as hasConsentUtil,
} from '@/lib/cookie-consent';

/**
 * Hook para gestionar el consentimiento de cookies
 * Proporciona estado reactivo y métodos para actualizar preferencias
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [mounted, setMounted] = useState(false);

  // Cargar consentimiento inicial
  useEffect(() => {
    setConsent(getCookieConsent());
    setMounted(true);
  }, []);

  // Escuchar cambios en el consentimiento (desde otros componentes)
  useEffect(() => {
    const handleConsentChange = (event: Event) => {
      const customEvent = event as CustomEvent<CookieConsent | null>;
      setConsent(customEvent.detail);
    };

    window.addEventListener('cookieConsentChange', handleConsentChange);
    
    return () => {
      window.removeEventListener('cookieConsentChange', handleConsentChange);
    };
  }, []);

  /**
   * Aceptar todas las cookies
   */
  const acceptAll = useCallback(() => {
    acceptAllUtil();
    setConsent(getCookieConsent());
  }, []);

  /**
   * Aceptar solo cookies esenciales
   */
  const acceptEssential = useCallback(() => {
    acceptEssentialUtil();
    setConsent(getCookieConsent());
  }, []);

  /**
   * Guardar preferencias personalizadas
   */
  const savePreferences = useCallback((prefs: Omit<CookieConsent, 'timestamp'>) => {
    setCookieConsent(prefs);
    setConsent(getCookieConsent());
  }, []);

  /**
   * Revocar consentimiento (resetear)
   */
  const revokeConsent = useCallback(() => {
    clearCookieConsent();
    setConsent(null);
  }, []);

  /**
   * Verificar si hay consentimiento
   */
  const hasConsent = useCallback(() => {
    return hasConsentUtil();
  }, []);

  return {
    consent,
    mounted,
    hasConsent: hasConsent(),
    acceptAll,
    acceptEssential,
    savePreferences,
    revokeConsent,
  };
}