'use client'

import { useState, useEffect } from 'react';
import { LocationManager, LocationResult } from '../LocationManager';
import { getCountryConfig } from '../CountryConfig';

/**
 * Hook para manejo de ubicación en componentes React
 */
export function useLocation() {
  const [locationData, setLocationData] = useState<LocationResult>({
    country: 'cl',
    source: 'fallback',
    confidence: 'low',
    canChange: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar detección de país
  useEffect(() => {
    LocationManager.getCurrentCountry()
      .then((result) => {
        setLocationData(result);
        setError(null);
      })
      .catch((err) => {
        console.error('Error detecting location:', err);
        setError('No se pudo detectar la ubicación');
        setLocationData({
          country: 'cl',
          source: 'fallback',
          confidence: 'low',
          canChange: true
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Escuchar cambios de país
  useEffect(() => {
    const handleCountryChange = (event: CustomEvent) => {
      if (event.detail.country) {
        const newCountry = event.detail.country;
        setLocationData(prev => ({
          ...prev,
          country: newCountry,
          source: event.detail.source
        }));
      } else {
        // Reset to auto detection
        setIsLoading(true);
        LocationManager.getCurrentCountry()
          .then((result) => {
            setLocationData(result);
            setError(null);
          })
          .catch((err) => {
            console.error('Error re-detecting location:', err);
            setError('Error al detectar ubicación');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tp-country-changed', handleCountryChange as EventListener);
      return () => {
        window.removeEventListener('tp-country-changed', handleCountryChange as EventListener);
      };
    }
  }, []);

  /**
   * Usuario selecciona manualmente un país
   */
  const setCountry = (countryCode: string) => {
    LocationManager.setUserPreference(countryCode);
  };

  /**
   * Reset a detección automática
   */
  const resetToAutoDetection = () => {
    LocationManager.resetToAutoDetection();
  };

  return {
    // Estado actual
    country: locationData.country,
    source: locationData.source,
    confidence: locationData.confidence,
    isLoading,
    error,

    // Información del país actual
    countryInfo: getCountryConfig(locationData.country),

    // Estados derivados
    isManualSelection: locationData.source === 'manual',
    isAutoDetected: ['netlify', 'browser'].includes(locationData.source),
    canChange: locationData.canChange,

    // Acciones
    setCountry,
    resetToAutoDetection,

    // Utilidades
    getDebugInfo: () => LocationManager.getDebugInfo()
  };
}

/**
 * Hook específico para personalización en web app
 */
export function useCountryPersonalization() {
  const location = useLocation();

  return {
    ...location,
    
    // Helpers para personalización
    formatCurrency: (amount: number) => {
      const currencyCode = location.countryInfo?.currency || 'CLP';
      const locale = location.countryInfo?.locale || 'es-CL';
      
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    },

    formatDate: (date: Date) => {
      const locale = location.countryInfo?.locale || 'es-CL';
      return date.toLocaleDateString(locale);
    },

    getLocalizedContent: (content: Record<string, any>) => {
      return content[location.country] || content['cl'] || content['default'];
    }
  };
}
