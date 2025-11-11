'use client'

import { useEffect, useState } from 'react';
import { useLocation } from '@tupatrimonio/location';
import { Button } from "@/components/ui/button";
import { Icon, IconContainer } from '@tupatrimonio/ui';
import { ArrowRight, Shield, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerificacionIdentidadRedirect() {
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
            window.location.href = `/${country}/verificacion-identidad`;
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
      <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background flex items-center justify-center">
        <div className="text-center">
          <Icon icon={Loader2} size="xl" variant="brand" className="mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Detectando tu ubicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-[var(--tp-background-light)] to-background flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card rounded-2xl shadow-2xl border-2 border-border p-8 text-center">
          <div className="mb-6">
            <IconContainer 
              icon={Shield} 
              variant="brand" 
              shape="rounded" 
              size="lg"
              className="mx-auto"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Verificación de Identidad
          </h1>
          
          <p className="text-muted-foreground mb-8">
            KYC y verificación biométrica específica para cada país con sus documentos oficiales y regulaciones locales.
          </p>

          {/* Auto-redirect countdown */}
          {redirectCountdown && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                <Icon icon={Clock} size="md" className="text-blue-600 dark:text-blue-400" />
                <span className="font-medium">
                  Redirigiendo en {redirectCountdown} segundos...
                </span>
              </div>
              <Button 
                onClick={handleCancelRedirect}
                variant="outline"
                size="sm"
                className="w-full border-2 border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                Detener redirección automática
              </Button>
            </div>
          )}
          
          <div className="space-y-4">
            <Link href="/cl/verificacion-identidad">
              <Button className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white shadow-lg hover:shadow-xl transition-all">
                <span className="mr-2">🇨🇱</span>
                Chile
                <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-2" />
              </Button>
            </Link>
            
            <Link href="/co/verificacion-identidad">
              <Button variant="outline" className="w-full border-2 hover:bg-accent/50 transition-all">
                <span className="mr-2">🇨🇴</span>
                Colombia - Próximamente
                <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-2" />
              </Button>
            </Link>
            
            <Link href="/mx/verificacion-identidad">
              <Button variant="outline" className="w-full border-2 hover:bg-accent/50 transition-all">
                <span className="mr-2">🇲🇽</span>
                México - Próximamente
                <Icon icon={ArrowRight} size="sm" variant="inherit" className="ml-2" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Detectando tu ubicación... Serás redirigido automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}