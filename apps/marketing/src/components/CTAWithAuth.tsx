'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';

interface CTAWithAuthProps {
  /**
   * URL de destino en la app principal
   */
  redirectUrl: string;
  /**
   * Título de la página
   */
  title: string;
  /**
   * Descripción de la acción
   */
  description: string;
  /**
   * Texto del botón principal
   */
  ctaText: string;
  /**
   * Beneficios a mostrar
   */
  benefits?: string[];
  /**
   * Mostrar el mensaje de redirección automática
   */
  showAutoRedirect?: boolean;
}

export function CTAWithAuth({
  redirectUrl,
  title,
  description,
  ctaText,
  benefits = [],
  showAutoRedirect = true,
}: CTAWithAuthProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasSession(true);
          if (showAutoRedirect) {
            // Redirigir automáticamente si hay sesión
            const timer = setInterval(() => {
              setCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(timer);
                  window.location.href = redirectUrl;
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            return () => clearInterval(timer);
          }
        } else {
          setHasSession(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setHasSession(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, [supabase, redirectUrl, showAutoRedirect]);

  const handleCTA = () => {
    window.location.href = redirectUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--tp-background-light)] to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-[var(--tp-brand)] animate-spin mb-4" />
              <p className="text-gray-600">Verificando tu sesión...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasSession && showAutoRedirect) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--tp-brand-5)] to-white flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-2 border-[var(--tp-brand)]">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-[var(--tp-brand)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">¡Ya tienes sesión activa!</CardTitle>
            <CardDescription className="text-base">
              Redirigiendo a tu cuenta...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-[var(--tp-brand)] mb-4">
                {countdown}
              </div>
              <p className="text-gray-600 mb-6">
                Serás redirigido automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}
              </p>
              <Button
                onClick={handleCTA}
                className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white"
                size="lg"
              >
                Ir Ahora
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[var(--tp-background-light)] to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Card principal */}
          <Card className="border-2 border-[var(--tp-brand)] shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Accede a TuPatrimonio</CardTitle>
              <CardDescription className="text-base">
                {hasSession 
                  ? 'Continúa donde lo dejaste'
                  : 'Crea tu cuenta gratis o inicia sesión'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCTA}
                className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
                size="lg"
              >
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {!hasSession && (
                <Alert className="bg-[var(--tp-brand-5)] border-[var(--tp-brand-20)]">
                  <AlertDescription className="text-sm text-gray-700">
                    <strong>Gratis para siempre.</strong> No necesitas tarjeta de crédito para empezar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Beneficios */}
          {benefits.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                ¿Por qué TuPatrimonio?
              </h3>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[var(--tp-brand)] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--tp-success)]" />
              <span>Sin permanencia</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--tp-success)]" />
              <span>Cancela cuando quieras</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[var(--tp-success)]" />
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

