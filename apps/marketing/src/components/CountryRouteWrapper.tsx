'use client'

import { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe } from 'lucide-react';
import { getSupportedCountries, getCountryConfig, type CountryConfig } from '@tupatrimonio/location';

interface CountryRouteWrapperProps {
  /**
   * Código del país actual (cl, mx, co, pe, ar)
   */
  country: string;
  /**
   * Contenido de la página
   */
  children: ReactNode;
  /**
   * Mostrar el header de selección de país
   */
  showCountryHeader?: boolean;
  /**
   * Clase adicional para el wrapper
   */
  className?: string;
}

export function CountryRouteWrapper({
  country,
  children,
  showCountryHeader = true,
  className = '',
}: CountryRouteWrapperProps) {
  const allCountries = getSupportedCountries();
  const currentCountry = getCountryConfig(country.toLowerCase()) || getCountryConfig('cl')!;
  const otherCountries = allCountries.filter(c => c.code !== country.toLowerCase());

  return (
    <div className={className}>
      {showCountryHeader && (
        <div className="bg-[var(--tp-brand-5)] border-b border-[var(--tp-brand-20)]">
          <div className="max-w-7xl tp-container py-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* País actual */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--tp-brand)]" />
                <span className="text-sm text-gray-700">Estás viendo TuPatrimonio para</span>
                <Badge 
                  variant="outline" 
                  className="bg-[var(--tp-brand)] text-white border-[var(--tp-brand)] font-semibold"
                >
                  {currentCountry.flag} {currentCountry.name}
                </Badge>
              </div>

              {/* Selector de otros países */}
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Otros países:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {otherCountries.map((c) => (
                    <Link key={c.code} href={`/${c.code}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)] px-2 ${
                          c.available ? 'text-[var(--tp-buttons)]' : 'text-gray-400'
                        }`}
                        title={c.available ? c.name : `${c.name} - Próximamente`}
                      >
                        {c.flag} {c.name}
                        {!c.available && (
                          <span className="ml-1 text-xs">✨</span>
                        )}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Hook para obtener la configuración del país actual
 */
export function useCountryConfig(country: string): CountryConfig {
  return getCountryConfig(country.toLowerCase()) || getCountryConfig('cl')!;
}

/**
 * Helper para formatear moneda según el país
 */
export function formatCurrency(amount: number, country: string): string {
  const config = getCountryConfig(country.toLowerCase()) || getCountryConfig('cl')!;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

