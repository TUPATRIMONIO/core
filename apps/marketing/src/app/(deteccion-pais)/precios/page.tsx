'use client'

import { useEffect, useState } from 'react';
import { useLocation } from '@tupatrimonio/location';
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PreciosRedirect() {
  const { country, isLoading } = useLocation();
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Auto-redirect en 10 segundos
  useEffect(() => {
    if (!isLoading) {
      setRedirectCountdown(10);
      
      const interval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev === 1) {
            clearInterval(interval);
            window.location.href = `/${country}/precios`;
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLoading, country]);

  const handleCancelRedirect = () => {
    setRedirectCountdown(null);
  };

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg border p-8 text-center">
          <DollarSign className="w-16 h-16 text-[var(--tp-buttons)] mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Precios <span className="text-[var(--tp-brand)]">TuPatrimonio</span>
          </h1>
          
          <p className="text-gray-600 mb-8">
            Precios específicos para cada país en moneda local con planes adaptados al mercado.
          </p>

          {/* Auto-redirect countdown */}
          {redirectCountdown && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-medium">
                  Redirigiendo en {redirectCountdown} segundos...
                </span>
              </div>
              <Button 
                onClick={handleCancelRedirect}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Detener redirección automática
              </Button>
            </div>
          )}
          
          <div className="space-y-4">
            <Link href="/cl/precios">
              <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
                <span className="mr-2">🇨🇱</span>
                Chile - Precios en CLP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/co">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇨🇴</span>
                Colombia - Próximamente COP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link href="/mx">
              <Button variant="outline" className="w-full">
                <span className="mr-2">🇲🇽</span>
                México - Próximamente MXN
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-blue-600">CLP</div>
                <div className="text-gray-600">Chile</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">COP</div>
                <div className="text-gray-600">Colombia</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">MXN</div>
                <div className="text-gray-600">México</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Detectando tu ubicación... Serás redirigido automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}