'use client'

import React, { createContext, useContext } from 'react';
import { useCountryPersonalization } from '../../../../packages/location/src/hooks/useLocation';

interface LocationContextType {
  country: string;
  countryInfo: any;
  source: string;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  getLocalizedContent: (content: Record<string, any>) => any;
  setCountry: (country: string) => void;
  resetToAutoDetection: () => void;
  isManualSelection: boolean;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const locationData = useCountryPersonalization();

  return (
    <LocationContext.Provider value={locationData}>
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
