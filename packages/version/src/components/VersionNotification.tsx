'use client';

import React from 'react';
import { UseVersionCheckResult } from '../hooks/useVersionCheck';

/**
 * Iconos SVG simples para evitar dependencias externas
 */
const RotateCcwIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const XIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </svg>
);

interface VersionNotificationProps {
  versionCheck: UseVersionCheckResult;
  className?: string;
}

/**
 * Componente de notificación que aparece cuando hay una nueva versión disponible
 * Utiliza el design system de TuPatrimonio con variables CSS personalizadas
 */
export function VersionNotification({ 
  versionCheck, 
  className = '' 
}: VersionNotificationProps) {
  const { hasUpdate, newVersion, isChecking, dismissUpdate, applyUpdate } = versionCheck;

  // No mostrar si no hay actualización o si está verificando
  if (!hasUpdate || !newVersion) {
    return null;
  }

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-50 
        bg-[var(--tp-brand)] text-white
        shadow-[var(--tp-shadow-lg)]
        transition-all duration-300 ease-in-out
        ${className}
      `}
      role="banner"
      aria-live="polite"
      aria-label="Nueva versión disponible"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Contenido principal del mensaje */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            
            {/* Icono de actualización */}
            <div className="flex-shrink-0">
              <RotateCcwIcon 
                className={`
                  h-5 w-5 text-white/90
                  ${isChecking ? 'animate-spin' : ''}
                `}
              />
            </div>
            
            {/* Texto del mensaje */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-tight">
                <strong>Nueva versión disponible</strong>
                <span className="hidden sm:inline"> - Recarga para obtener las últimas mejoras y correcciones</span>
              </p>
              {newVersion.version && (
                <p className="text-xs text-white/80 mt-1 hidden sm:block">
                  Versión {newVersion.version} - {new Date(newVersion.timestamp).toLocaleString('es-CL')}
                </p>
              )}
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-2 flex-shrink-0">
            
            {/* Botón de recargar */}
            <button
              onClick={applyUpdate}
              disabled={isChecking}
              className={`
                inline-flex items-center justify-center
                px-3 py-1.5 text-xs font-semibold
                bg-white/10 hover:bg-white/20 
                border border-white/20 hover:border-white/30
                rounded-[var(--tp-radius-md)]
                text-white transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/50
                disabled:opacity-60 disabled:cursor-not-allowed
                min-w-[80px]
              `}
              aria-label="Recargar aplicación"
            >
              {isChecking ? (
                <>
                  <RotateCcwIcon className="h-3 w-3 mr-1 animate-spin" />
                  <span className="hidden sm:inline">Verificando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <RotateCcwIcon className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Recargar</span>
                  <span className="sm:hidden">OK</span>
                </>
              )}
            </button>
            
            {/* Botón de cerrar/descartar */}
            <button
              onClick={dismissUpdate}
              disabled={isChecking}
              className={`
                inline-flex items-center justify-center
                p-1.5 rounded-[var(--tp-radius-sm)]
                text-white/70 hover:text-white
                bg-white/0 hover:bg-white/10
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/50
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
              aria-label="Cerrar notificación"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook personalizado para integrar fácilmente el sistema de versiones
 * Combina useVersionCheck con el componente de notificación
 */
export interface UseVersionNotificationOptions {
  checkIntervalMs?: number;
  enableOnlyInProduction?: boolean;
  versionEndpoint?: string;
  className?: string;
}

export function useVersionNotification(options: UseVersionNotificationOptions = {}) {
  // Este hook se implementará si es necesario, por ahora devolvemos las props necesarias
  return {
    ...options
  };
}

export default VersionNotification;
