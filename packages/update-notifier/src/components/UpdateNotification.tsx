'use client';

/**
 * Componente de notificación de actualización
 * Muestra una notificación en la esquina superior derecha cuando hay una nueva versión
 */

import React, { useState, useEffect } from 'react';
import { useUpdateDetection } from '../hooks/useUpdateDetection';

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

          .tp-animate-slide-in {
            animation: tp-slide-in 0.3s ease-out;
          }
        `
      }} />
      <div
        className="fixed top-4 right-4 z-50 w-96 bg-[var(--tp-background-light)] rounded-lg shadow-lg border border-[var(--tp-lines-30)] overflow-hidden tp-animate-slide-in"
        role="alert"
        aria-live="assertive"
      >
        {/* Barra de progreso */}
        <div className="h-1 bg-[var(--tp-lines-20)]">
          <div
            className="h-full bg-[var(--tp-brand)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header con título y botón cerrar */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[var(--tp-brand)]"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h3 className="font-semibold text-[var(--tp-background-dark)] font-quicksand">
                Nueva versión disponible
              </h3>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors"
              aria-label="Cerrar notificación"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenido */}
          <p className="text-sm text-[var(--tp-lines)] mb-4 font-quicksand">
            Hay una actualización disponible. La página se actualizará automáticamente en{' '}
            <span className="font-semibold text-[var(--tp-brand)]">{countdown}</span> segundo{countdown !== 1 ? 's' : ''}.
          </p>

          {newVersion && (
            <div className="text-xs text-[var(--tp-lines-60)] mb-4 p-2 bg-[var(--tp-bg-light-50)] rounded font-quicksand">
              <div>Versión actual: {newVersion.version}</div>
              <div className="text-[10px] mt-1">
                Desplegado: {new Date(newVersion.deployedAt).toLocaleString('es-CL')}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={handleUpdateNow}
              className="flex-1 px-4 py-2 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white rounded-md text-sm font-medium transition-colors font-quicksand"
            >
              Actualizar ahora
            </button>
            <button
              onClick={handlePostpone}
              className="flex-1 px-4 py-2 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white rounded-md text-sm font-medium transition-colors font-quicksand"
            >
              Posponer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

