'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';

interface VersionInfo {
  timestamp: number;
  buildId: string;
  version: string;
  app: string;
  buildDate: string;
}

interface UpdateNotificationProps {
  onDismiss?: () => void;
  autoUpdateDelaySeconds?: number;
  checkIntervalMinutes?: number;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  onDismiss, 
  autoUpdateDelaySeconds = 10,
  checkIntervalMinutes = 5
}) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoUpdateCancelled, setAutoUpdateCancelled] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      // Fetch version.json con cache busting
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!response.ok) {
        console.log('No se pudo obtener version.json');
        return;
      }

      const serverVersion: VersionInfo = await response.json();
      const storedVersion = localStorage.getItem('app_version');
      const storedTimestamp = localStorage.getItem('app_timestamp');

      // Primera carga - guardar versión actual
      if (!storedVersion || !storedTimestamp) {
        localStorage.setItem('app_version', serverVersion.version);
        localStorage.setItem('app_timestamp', serverVersion.timestamp.toString());
        localStorage.setItem('app_buildId', serverVersion.buildId);
        return;
      }

      // Comparar timestamps para detectar nueva versión
      const currentTimestamp = parseInt(storedTimestamp);
      if (serverVersion.timestamp > currentTimestamp) {
        console.log('🎉 Nueva versión detectada!', {
          current: new Date(currentTimestamp).toISOString(),
          new: new Date(serverVersion.timestamp).toISOString()
        });
        
        setUpdateAvailable(true);
        setShowNotification(true);
        setCountdown(autoUpdateDelaySeconds);
      }
    } catch (error) {
      console.log('Error checking for updates:', error);
    }
  }, [autoUpdateDelaySeconds]);

  // Configurar verificación periódica
  useEffect(() => {
    // Verificación inicial después de 2 segundos
    const initialCheck = setTimeout(() => {
      checkForUpdates();
    }, 2000);

    // Verificación periódica
    const intervalMs = checkIntervalMinutes * 60 * 1000;
    const checkInterval = setInterval(() => {
      checkForUpdates();
    }, intervalMs);

    // Verificar al recuperar el foco
    const handleFocus = () => {
      checkForUpdates();
    };

    // Verificar al cambiar visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(checkInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdates, checkIntervalMinutes]);

  // Countdown automático
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;

    if (countdown !== null && countdown > 0 && !autoUpdateCancelled) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            handleUpdate();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdown, autoUpdateCancelled]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Actualizar versión almacenada
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-cache' });
      if (response.ok) {
        const serverVersion: VersionInfo = await response.json();
        localStorage.setItem('app_version', serverVersion.version);
        localStorage.setItem('app_timestamp', serverVersion.timestamp.toString());
        localStorage.setItem('app_buildId', serverVersion.buildId);
      }

      // Limpiar cache del navegador si está disponible
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Recargar con cache busting
      window.location.href = `${window.location.pathname}?v=${Date.now()}`;
    } catch (error) {
      console.log('Error updating:', error);
      // Fallback: simple reload
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
    setUpdateAvailable(false);
    setCountdown(null);
    setAutoUpdateCancelled(true);
    onDismiss?.();
  };

  if (!updateAvailable || !showNotification) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0 rounded-xl p-4 shadow-xl border"
      style={{
        backgroundColor: 'var(--tp-background-light)',
        borderColor: 'var(--tp-lines-20)',
      }}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div 
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: 'var(--tp-buttons-10)',
              color: 'var(--tp-buttons)',
            }}
          >
            <Download className="h-5 w-5" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="text-sm font-semibold"
              style={{ color: 'var(--tp-background-dark)' }}
            >
              Nueva versión disponible 🎉
            </h3>
            <button
              onClick={handleDismiss}
              className="hover:opacity-70 transition-opacity"
              style={{ color: 'var(--tp-lines)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p 
            className="text-xs mb-4"
            style={{ color: 'var(--tp-lines)' }}
          >
            {countdown !== null ? (
              <>
                Se actualizará automáticamente en{' '}
                <span 
                  className="font-bold"
                  style={{ color: 'var(--tp-buttons)' }}
                >
                  {countdown}s
                </span>
              </>
            ) : (
              'Hay mejoras y correcciones disponibles.'
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: 'var(--tp-buttons)',
                color: 'white',
              }}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-2" />
                  Actualizar Ahora
                </>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--tp-background-light)',
                color: 'var(--tp-lines)',
                border: '1px solid var(--tp-lines-20)',
              }}
            >
              {countdown !== null ? 'Cancelar' : 'Más Tarde'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

