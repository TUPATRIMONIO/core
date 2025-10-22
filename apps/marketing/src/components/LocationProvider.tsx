'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocationResult, LocationManager } from '../../../../packages/location/src/LocationManager';

interface LocationContextType extends LocationResult {
  isLoading: boolean;
  error: string | null;
  setCountry: (country: string) => void;
  resetToAutoDetection: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationData, setLocationData] = useState<LocationResult>({
    country: 'cl',
    source: 'fallback',
    confidence: 'low',
    canChange: true
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar detección
  useEffect(() => {
    LocationManager.getCurrentCountry()
      .then((result) => {
        setLocationData(result);
        setError(null);
      })
      .catch((err) => {
        console.error('Error detecting location:', err);
        setError('No se pudo detectar la ubicación');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Escuchar cambios
  useEffect(() => {
    const handleCountryChange = (event: CustomEvent) => {
      if (event.detail.country) {
        setLocationData(prev => ({
          ...prev,
          country: event.detail.country,
          source: event.detail.source
        }));
      } else {
        // Redetectar
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

    window.addEventListener('tp-country-changed', handleCountryChange as EventListener);
    return () => {
      window.removeEventListener('tp-country-changed', handleCountryChange as EventListener);
    };
  }, []);

  const setCountry = (countryCode: string) => {
    LocationManager.setUserPreference(countryCode);
  };

  const resetToAutoDetection = () => {
    LocationManager.resetToAutoDetection();
  };

  const contextValue: LocationContextType = {
    ...locationData,
    isLoading,
    error,
    setCountry,
    resetToAutoDetection
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
}
