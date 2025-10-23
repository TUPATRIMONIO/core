import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  VersionInfo, 
  VersionCheckConfig, 
  fetchServerVersion,
  getCurrentVersion,
  setCurrentVersion,
  hasNewVersion,
  shouldEnableVersionCheck,
  isVersionDismissed,
  dismissVersion,
  reloadWithCacheBust,
  initializeVersion
} from '../utils/versionUtils';

export interface UseVersionCheckResult {
  /** Si hay una nueva versión disponible */
  hasUpdate: boolean;
  /** Información de la nueva versión */
  newVersion: VersionInfo | null;
  /** Si está verificando actualizaciones */
  isChecking: boolean;
  /** Error en la verificación */
  error: string | null;
  /** Función para descartar la notificación */
  dismissUpdate: () => void;
  /** Función para recargar con la nueva versión */
  applyUpdate: () => void;
  /** Función para verificar manualmente */
  checkNow: () => void;
}

export function useVersionCheck(config: VersionCheckConfig = {}): UseVersionCheckResult {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const configRef = useRef(config);
  
  // Actualizar config ref cuando cambie
  configRef.current = config;

  const checkVersion = useCallback(async () => {
    if (!shouldEnableVersionCheck(configRef.current)) {
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const serverVersion = await fetchServerVersion(configRef.current.versionEndpoint);
      
      if (!serverVersion) {
        setError('No se pudo obtener información de la versión del servidor');
        return;
      }

      const currentVersion = getCurrentVersion();
      
      if (hasNewVersion(currentVersion, serverVersion)) {
        // Verificar si esta versión ya fue dismisseada
        if (!isVersionDismissed(serverVersion.buildId)) {
          setNewVersion(serverVersion);
          setHasUpdate(true);
        }
      } else {
        // No hay actualización, limpiar estado si había
        setHasUpdate(false);
        setNewVersion(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al verificar versión');
      console.error('Version check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    if (newVersion) {
      dismissVersion(newVersion.buildId);
      setHasUpdate(false);
      setNewVersion(null);
    }
  }, [newVersion]);

  const applyUpdate = useCallback(() => {
    if (newVersion) {
      // Actualizar la versión almacenada antes de recargar
      setCurrentVersion(newVersion);
      reloadWithCacheBust();
    }
  }, [newVersion]);

  const checkNow = useCallback(() => {
    checkVersion();
  }, [checkVersion]);

  // Configurar interval para verificaciones automáticas
  useEffect(() => {
    if (!shouldEnableVersionCheck(configRef.current)) {
      return;
    }

    const intervalMs = configRef.current.checkIntervalMs || 5 * 60 * 1000; // 5 minutos por defecto

    // Verificación inicial
    checkVersion();

    // Configurar interval
    intervalRef.current = setInterval(checkVersion, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkVersion]);

  // Verificar cuando la ventana recupera el focus
  useEffect(() => {
    if (!shouldEnableVersionCheck(configRef.current)) {
      return;
    }

    const handleFocus = () => {
      checkVersion();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  // Inicializar versión al montar el componente
  useEffect(() => {
    if (shouldEnableVersionCheck(configRef.current)) {
      initializeVersion();
    }
  }, []);

  return {
    hasUpdate,
    newVersion,
    isChecking,
    error,
    dismissUpdate,
    applyUpdate,
    checkNow
  };
}
