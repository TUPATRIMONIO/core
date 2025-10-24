'use client';

/**
 * Componente de notificación de actualización
 * Muestra una notificación en la esquina superior derecha cuando hay una nueva versión
 * Usa componentes de shadcn/ui para un diseño profesional
 */

import React, { useState, useEffect } from 'react';
import { useUpdateDetection } from '../hooks/useUpdateDetection';
import { Alert, AlertTitle, AlertDescription } from '@tupatrimonio/ui';
import { Button } from '@tupatrimonio/ui';

const COUNTDOWN_SECONDS = 10;

export function UpdateNotification() {
  const { hasUpdate, newVersion, dismissUpdate, applyUpdate } = useUpdateDetection();
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [isVisible, setIsVisible] = useState(false);

  // Manejar countdown
  useEffect(() => {
    if (hasUpdate) {
      setIsVisible(true);
      setCountdown(COUNTDOWN_SECONDS);
    }
  }, [hasUpdate]);

  useEffect(() => {
    if (!isVisible || !hasUpdate) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          applyUpdate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, hasUpdate, applyUpdate]);

  const handleUpdateNow = () => {
    applyUpdate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    dismissUpdate();
  };

  const handlePostpone = () => {
    setIsVisible(false);
    // No llamar dismissUpdate aquí para que vuelva a aparecer en la siguiente verificación
  };

  if (!isVisible || !hasUpdate) return null;

  const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes tp-slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes tp-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          .tp-animate-slide-in {
            animation: tp-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .tp-pulse {
            animation: tp-pulse 2s ease-in-out infinite;
          }
        `
      }} />
      
      <div className="fixed top-4 right-4 z-50 w-full max-w-md tp-animate-slide-in">
        <Alert className="bg-[var(--tp-background-light)] border-[var(--tp-brand-20)] shadow-xl">
          {/* Barra de progreso superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--tp-lines-10)] rounded-t-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Ícono del rayo - estructura correcta de shadcn/ui */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-[var(--tp-brand-10)] rounded-full blur-md tp-pulse"></div>
            <svg
              className="text-[var(--tp-brand)] relative z-10"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Botón de cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors p-1 rounded-md hover:bg-[var(--tp-bg-light-50)]"
            aria-label="Cerrar notificación"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <AlertTitle className="text-[var(--tp-background-dark)] font-josefin-sans text-base mb-2 pr-6">
            Nueva versión disponible
          </AlertTitle>

          <AlertDescription className="text-[var(--tp-lines)] space-y-3">
            <p>
              Hay una actualización disponible. La página se actualizará automáticamente en{' '}
              <span className="font-semibold text-[var(--tp-brand)]">
                {countdown}
              </span>{' '}
              segundo{countdown !== 1 ? 's' : ''}.
            </p>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleUpdateNow}
                variant="default"
                size="sm"
                className="flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar ahora
              </Button>
              <Button
                onClick={handlePostpone}
                variant="outline"
                size="sm"
                className="flex-1 border-[var(--tp-lines-30)] hover:bg-[var(--tp-bg-light-50)] hover:border-[var(--tp-lines-50)] text-[var(--tp-background-dark)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Posponer
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}

