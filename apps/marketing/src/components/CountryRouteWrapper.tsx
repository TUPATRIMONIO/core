'use client'

import { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe } from 'lucide-react';

interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  locale: string;
}

const COUNTRIES: Record<string, CountryConfig> = {
  cl: {
    code: 'cl',
    name: 'Chile',
    flag: '🇨🇱',
    currency: 'CLP',
    locale: 'es-CL',
  },
  mx: {
    code: 'mx',
    name: 'México',
    flag: '🇲🇽',
    currency: 'MXN',
    locale: 'es-MX',
  },
  co: {
    code: 'co',
    name: 'Colombia',
    flag: '🇨🇴',
    currency: 'COP',
    locale: 'es-CO',
  },
  pe: {
    code: 'pe',
    name: 'Perú',
    flag: '🇵🇪',
    currency: 'PEN',
    locale: 'es-PE',
  },
  ar: {
    code: 'ar',
    name: 'Argentina',
    flag: '🇦🇷',
    currency: 'ARS',
    locale: 'es-AR',
  },
};

const OTHER_COUNTRIES = ['mx', 'co', 'pe', 'ar', 'cl'];

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
  const currentCountry = COUNTRIES[country.toLowerCase()] || COUNTRIES.cl;
  const otherCountries = OTHER_COUNTRIES.filter(c => c !== country);

  return (
    <div className={className}>
      {showCountryHeader && (
        <div className="bg-[var(--tp-brand-5)] border-b border-[var(--tp-brand-20)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
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
                <span className="text-sm text-gray-600">Cambiar país:</span>
                <div className="flex items-center gap-2">
                  {otherCountries.slice(0, 3).map((countryCode) => {
                    const c = COUNTRIES[countryCode];
                    return (
                      <Link key={countryCode} href={`/${countryCode}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--tp-buttons)] hover:bg-[var(--tp-brand-10)] hover:text-[var(--tp-brand)] px-2"
                          title={c.name}
                        >
                          {c.flag} {c.name}
                        </Button>
                      </Link>
                    );
                  })}
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
  return COUNTRIES[country.toLowerCase()] || COUNTRIES.cl;
}

/**
 * Helper para formatear moneda según el país
 */
export function formatCurrency(amount: number, country: string): string {
  const config = COUNTRIES[country.toLowerCase()] || COUNTRIES.cl;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

