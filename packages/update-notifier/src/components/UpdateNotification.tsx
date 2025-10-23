'use client';

/**
 * Componente de notificación de actualización
 * Muestra una notificación en la esquina superior derecha cuando hay una nueva versión
 * Usa componentes de shadcn/ui para un diseño profesional
 */

import React, { useState, useEffect } from 'react';
import { useUpdateDetection } from '../hooks/useUpdateDetection';

const COUNTDOWN_SECONDS = 10;

// Componentes shadcn/ui inline para evitar dependencias
// En producción, estos se importarían desde @/components/ui
const Alert = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    role="alert"
    className={`relative w-full rounded-lg border px-4 py-3 text-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const AlertTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h5>
);

const AlertDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ 
  className = '', 
  variant = 'default',
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' }) => {
  const variants = {
    default: 'bg-[var(--tp-brand)] text-white hover:bg-[var(--tp-brand-light)] focus-visible:ring-[var(--tp-brand-20)]',
    outline: 'border border-[var(--tp-lines-30)] bg-transparent hover:bg-[var(--tp-bg-light-50)] text-[var(--tp-background-dark)]',
    ghost: 'hover:bg-[var(--tp-bg-light-50)] text-[var(--tp-background-dark)]'
  };
  
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 font-quicksand ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

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
      
      <div className="fixed top-4 right-4 z-50 w-[420px] tp-animate-slide-in">
        <Alert className="bg-[var(--tp-background-light)] border-[var(--tp-brand-20)] shadow-xl backdrop-blur-sm">
          {/* Barra de progreso superior */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--tp-lines-10)] rounded-t-lg overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-start gap-3 pt-2">
            {/* Icono con animación */}
            <div className="flex-shrink-0 mt-0.5">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--tp-brand-10)] rounded-full blur-md tp-pulse"></div>
                <svg
                  className="w-5 h-5 text-[var(--tp-brand)] relative z-10"
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
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <AlertTitle className="text-[var(--tp-background-dark)] font-quicksand text-base">
                  Nueva versión disponible
                </AlertTitle>
                <button
                  onClick={handleDismiss}
                  className="text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors p-1 rounded-md hover:bg-[var(--tp-bg-light-50)]"
                  aria-label="Cerrar notificación"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <AlertDescription className="text-[var(--tp-lines)] font-quicksand">
                <p className="mb-3">
                  Hay una actualización disponible. La página se actualizará automáticamente en{' '}
                  <span className="font-semibold text-[var(--tp-brand)] inline-flex items-center justify-center min-w-[24px]">
                    {countdown}
                  </span>{' '}
                  segundo{countdown !== 1 ? 's' : ''}.
                </p>

                {newVersion && (
                  <div className="text-xs text-[var(--tp-lines-60)] mb-3 p-2.5 bg-[var(--tp-bg-light-50)] rounded-md border border-[var(--tp-lines-10)]">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Build ID:</span>
                      <span className="font-mono">{newVersion.buildId}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-medium">Desplegado:</span>
                      <span className="text-[10px]">
                        {new Date(newVersion.deployedAt).toLocaleString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateNow}
                    variant="default"
                    className="flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualizar ahora
                  </Button>
                  <Button
                    onClick={handlePostpone}
                    variant="outline"
                    className="flex-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Posponer
                  </Button>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      </div>
    </>
  );
}

