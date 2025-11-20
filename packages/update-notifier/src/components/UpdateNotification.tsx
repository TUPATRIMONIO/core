'use client';

/**
 * Componente de notificación de actualización
 * Diseño moderno y empático siguiendo las guidelines de TuPatrimonio
 * Funciona perfectamente en light y dark mode
 */

import React, { useState, useEffect } from 'react';
import { useUpdateDetection } from '../hooks/useUpdateDetection';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@tupatrimonio/ui';
import { Button } from '@tupatrimonio/ui';
import { Icon, IconContainer } from '@tupatrimonio/ui';
import { Sparkles, RefreshCw, X, AlertCircle } from 'lucide-react';

export function UpdateNotification() {
  const { hasUpdate, dismissUpdate, applyUpdate } = useUpdateDetection();
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar notificación cuando hay actualización
  useEffect(() => {
    if (hasUpdate) {
      setIsVisible(true);
    }
  }, [hasUpdate]);

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

          @keyframes tp-pulse-glow {
            0%, 100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.05);
              opacity: 1;
            }
          }

          .tp-animate-slide-in {
            animation: tp-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .tp-pulse-glow {
            animation: tp-pulse-glow 2s ease-in-out infinite;
          }
        `
      }} />
      
      <div
        className="fixed top-4 right-4 w-80 tp-animate-slide-in"
        style={{ zIndex: 9999 }}
      >
        <Card className="border-2 border-[var(--tp-brand)] shadow-2xl bg-card relative overflow-hidden">
          {/* Botón de cerrar mejorado */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50 z-10"
            aria-label="Cerrar notificación"
          >
            <Icon icon={X} size="xs" variant="inherit" />
          </button>

          <CardHeader className="pb-3 pt-4 pr-10">
            <div className="flex items-start gap-3">
              {/* Ícono animado con efecto glow */}
              <div className="tp-pulse-glow">
                <IconContainer 
                  icon={Sparkles} 
                  variant="solid-brand" 
                  shape="rounded" 
                  size="sm"
                />
              </div>
              
              <div className="flex-1">
                <CardTitle className="text-base mb-1">
                  ¡Hay algo nuevo para ti!
                </CardTitle>
                <CardDescription className="text-xs">
                  Acabamos de mejorar la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4 space-y-3">
            {/* Mensaje empático y claro */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tenemos una versión mejorada lista para ti. Cuando actualices, la página se recargará por completo.
            </p>

            {/* Trust indicator - honesto y empático */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Icon icon={AlertCircle} size="xs" className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                Guarda tu trabajo antes de actualizar
              </span>
            </div>

            {/* Botones de acción mejorados */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleUpdateNow}
                size="sm"
                className="flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Icon icon={RefreshCw} size="xs" variant="white" />
                Actualizar Ahora
              </Button>
              <Button
                onClick={handlePostpone}
                variant="outline"
                size="sm"
                className="flex-1 border-2 hover:bg-muted/50 transition-all"
              >
                Más Tarde
              </Button>
            </div>

            {/* Texto de ayuda sutil */}
            <p className="text-xs text-muted-foreground/70 text-center">
              Solo tomará un momento y vale la pena
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

