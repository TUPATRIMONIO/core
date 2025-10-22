'use client'

import { useEffect, useState } from 'react';
import { useLocation } from '../../../../../packages/location/src/hooks/useLocation';
import { CountrySelector } from '../../../../../packages/location/src/components/CountrySelector';
import { getSupportedCountries } from '../../../../../packages/location/src/CountryConfig';
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function FirmasElectronicasLanding() {
  const { country, countryInfo, source, isLoading } = useLocation();
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  
  const countries = getSupportedCountries();

  // Auto-redirect solo si es detección automática y usuario no ha interactuado
  useEffect(() => {
    if (!isLoading && !userInteracted && ['netlify', 'browser'].includes(source)) {
      setRedirectCountdown(5);
      
      const interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev === 1) {
            clearInterval(interval);
            window.location.href = `/${country}/firmas-electronicas`;
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading, userInteracted, source, country]);

  // Detectar interacción del usuario
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      setRedirectCountdown(null);
    };

    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Detectando tu ubicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con selector de país */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[var(--tp-brand)]">TuPatrimonio</h1>
            {['netlify', 'browser'].includes(source) && (
              <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">
                País detectado automáticamente
              </div>
            )}
          </div>
          <CountrySelector variant="minimal" />
        </div>
      </div>

      <div className="flex items-center justify-center py-20">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl border p-8 text-center">
            <Globe className="w-16 h-16 text-[var(--tp-brand)] mx-auto mb-6" />
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Firma Electrónica para {countryInfo?.name}
            </h1>
            
            <p className="text-gray-600 mb-8">
              Información específica, precios en {countryInfo?.currency} y regulaciones locales
            </p>

            {/* Auto-redirect countdown */}
            {redirectCountdown && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">
                    Redirigiendo en {redirectCountdown} segundos...
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setRedirectCountdown(null);
                    setUserInteracted(true);
                  }}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  Cancelar redirect automático
                </button>
              </div>
            )}

            <div className="space-y-4">
              <Link href={`/${country}/firmas-electronicas`}>
                <Button 
                  size="lg" 
                  className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                >
                  <span className="mr-2">{countryInfo?.flag}</span>
                  Continuar a {countryInfo?.name}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">¿No es tu país?</p>
                <CountrySelector showLabel={true} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {source === 'netlify' && 'Ubicación detectada por IP'}
                {source === 'browser' && 'Ubicación detectada por configuración del navegador'}
                {source === 'manual' && 'País seleccionado manualmente'}
                {source === 'fallback' && 'Usando ubicación por defecto'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}