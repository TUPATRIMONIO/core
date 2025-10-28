/**
 * Hook para detectar actualizaciones de la aplicación
 * Verifica cada 5 minutos y cuando el usuario regresa a la pestaña
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentVersion,
  setCurrentVersion,
  hasVersionChanged,
  isUpdateDismissed,
  dismissUpdate,
  fetchLatestVersion,
  clearCacheAndReload,
  type VersionInfo,
} from '../utils/version-checker';

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos

export interface UseUpdateDetectionResult {
  hasUpdate: boolean;
  currentVersion: VersionInfo | null;
  newVersion: VersionInfo | null;
  checkNow: () => Promise<void>;
  dismissUpdate: () => void;
  applyUpdate: () => Promise<void>;
}

export function useUpdateDetection(): UseUpdateDetectionResult {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [currentVersion, setCurrentVersionState] = useState<VersionInfo | null>(null);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const checkingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  /**
   * Verifica si hay una nueva versión disponible
   */
  const checkForUpdate = useCallback(async () => {
    // Evitar múltiples checks simultáneos
    if (checkingRef.current) return;
    
    checkingRef.current = true;
    
    try {
      const latest = await fetchLatestVersion();
      
      if (!latest) {
        checkingRef.current = false;
        return;
      }

      const current = getCurrentVersion();
      
      // Si es la primera vez, solo guardar la versión
      if (!current) {
        setCurrentVersion(latest);
        setCurrentVersionState(latest);
        checkingRef.current = false;
        return;
      }

      // Verificar si hay cambios
      if (hasVersionChanged(current, latest)) {
        // Verificar si el usuario ya descartó esta actualización
        if (!isUpdateDismissed(latest.version)) {
          setNewVersion(latest);
          setCurrentVersionState(current);
          setHasUpdate(true);
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      checkingRef.current = false;
    }
  }, []);

  /**
   * Descarta la actualización actual
   */
  const handleDismissUpdate = useCallback(() => {
    if (newVersion) {
      dismissUpdate(newVersion.version);
      setHasUpdate(false);
      setNewVersion(null);
    }
  }, [newVersion]);

  /**
   * Aplica la actualización limpiando caché y recargando
   */
  const handleApplyUpdate = useCallback(async () => {
    if (newVersion) {
      setCurrentVersion(newVersion);
      await clearCacheAndReload();
    }
  }, [newVersion]);

  /**
   * Configurar verificación periódica y listeners
   */
  useEffect(() => {
    // Check inicial
    checkForUpdate();

    // Verificar cada 5 minutos
    intervalRef.current = setInterval(checkForUpdate, CHECK_INTERVAL);

    // Verificar cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    // Verificar cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      checkForUpdate();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          checkForUpdate();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkForUpdate]);

  return {
    hasUpdate,
    currentVersion,
    newVersion,
    checkNow: checkForUpdate,
    dismissUpdate: handleDismissUpdate,
    applyUpdate: handleApplyUpdate,
  };
}

