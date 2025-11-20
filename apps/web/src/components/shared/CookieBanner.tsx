'use client';

import { useState, useEffect } from 'react';
import { Cookie, Settings, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { CookiePreferencesDialog } from './CookiePreferencesDialog';

/**
 * Banner de Consentimiento de Cookies
 * Aparece en la primera visita, fixed bottom center
 * Mobile-first design - Idéntico al de marketing
 */
export function CookieBanner() {
  const { hasConsent, acceptAll, acceptEssential, mounted } = useCookieConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Solo mostrar si no hay consentimiento previo
    if (mounted && !hasConsent) {
      // Pequeño delay para mejor UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mounted, hasConsent]);

  // No renderizar hasta que esté montado (evitar hydration mismatch)
  if (!mounted || !showBanner) {
    return null;
  }

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleEssentialOnly = () => {
    acceptEssential();
    setShowBanner(false);
  };

  const handleConfigure = () => {
    setShowDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      // Si cerró el diálogo, verificar si ya dio consentimiento
      if (hasConsent) {
        setShowBanner(false);
      }
    }
  };

  return (
    <>
      {/* Banner */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500"
        role="dialog"
        aria-live="polite"
        aria-label="Consentimiento de cookies"
        style={{
          animation: 'slideInFromBottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideInFromBottom {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `
        }} />
        <div className="max-w-4xl mx-auto bg-card border-2 border-border rounded-xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Icono y Texto */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                  <Cookie className="w-6 h-6 text-[var(--tp-buttons)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    🍪 Usamos Cookies para Tu Tranquilidad
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Queremos que tu experiencia sea la mejor. Usamos cookies esenciales para 
                    que el sitio funcione y cookies de analytics para entender cómo mejorarlo. 
                    Tú decides qué aceptar.{' '}
                    <a 
                      href="/legal/cookies" 
                      className="text-[var(--tp-buttons)] hover:text-[var(--tp-buttons-hover)] underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver detalles
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                onClick={handleAcceptAll}
                className="w-full sm:w-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] whitespace-nowrap"
                size="lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aceptar Todas
              </Button>
              <Button
                onClick={handleEssentialOnly}
                variant="outline"
                className="w-full sm:w-auto hover:bg-[var(--tp-bg-light-20)] whitespace-nowrap"
                size="lg"
              >
                Solo Esenciales
              </Button>
              <Button
                onClick={handleConfigure}
                variant="ghost"
                className="w-full sm:w-auto hover:bg-[var(--tp-bg-light-20)] whitespace-nowrap"
                size="lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de Preferencias */}
      <CookiePreferencesDialog 
        open={showDialog} 
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
