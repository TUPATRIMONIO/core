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
    console.log('🔍 [UpdateNotifier] Iniciando verificación de actualizaciones...');
    
    // Evitar múltiples checks simultáneos
    if (checkingRef.current) {
      console.log('⏭️ [UpdateNotifier] Ya hay un check en progreso, saltando...');
      return;
    }
    
    checkingRef.current = true;
    console.log('🚀 [UpdateNotifier] Verificación iniciada');
    
    try {
      console.log('📡 [UpdateNotifier] Fetching versión del servidor...');
      const latest = await fetchLatestVersion();
      console.log('📥 [UpdateNotifier] Versión del servidor:', latest);
      
      if (!latest) {
        console.warn('⚠️ [UpdateNotifier] No se pudo obtener la versión del servidor');
        checkingRef.current = false;
        return;
      }

      const current = getCurrentVersion();
      console.log('💾 [UpdateNotifier] Versión local almacenada:', current);
      
      // Si es la primera vez, solo guardar la versión
      if (!current) {
        console.log('🆕 [UpdateNotifier] Primera carga, guardando versión actual:', latest);
        setCurrentVersion(latest);
        setCurrentVersionState(latest);
        checkingRef.current = false;
        return;
      }

      // Verificar si hay cambios
      const versionChanged = hasVersionChanged(current, latest);
      console.log('🔄 [UpdateNotifier] ¿Versión cambió?', versionChanged);
      console.log('📊 [UpdateNotifier] Comparación detallada:', {
        currentVersion: current.version,
        currentBuildId: current.buildId,
        latestVersion: latest.version,
        latestBuildId: latest.buildId
      });
      
      if (versionChanged) {
        const dismissed = isUpdateDismissed(latest.version);
        console.log('🚫 [UpdateNotifier] ¿Update descartado por el usuario?', dismissed);
        
        if (!dismissed) {
          console.log('🎉 [UpdateNotifier] ¡NUEVA VERSIÓN DETECTADA! Mostrando popup...');
          setNewVersion(latest);
          setCurrentVersionState(current);
          setHasUpdate(true);
        } else {
          console.log('🤐 [UpdateNotifier] Update descartado previamente, no mostrando popup');
        }
      } else {
        console.log('✅ [UpdateNotifier] No hay cambios, versión actual');
      }
    } catch (error) {
      console.error('❌ [UpdateNotifier] Error durante verificación:', error);
      console.error('📄 [UpdateNotifier] Detalles del error:', {
        message: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      checkingRef.current = false;
      console.log('🏁 [UpdateNotifier] Verificación finalizada');
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
    console.log('🎯 [UpdateNotifier] Inicializando hook useUpdateDetection...');
    
    // Check inicial
    console.log('⏰ [UpdateNotifier] Ejecutando verificación inicial...');
    checkForUpdate();

    // Verificar cada 5 minutos
    console.log(`⏱️ [UpdateNotifier] Configurando intervalo de verificación cada ${CHECK_INTERVAL / 60000} minutos`);
    intervalRef.current = setInterval(() => {
      console.log('🕒 [UpdateNotifier] Ejecutando verificación programada...');
      checkForUpdate();
    }, CHECK_INTERVAL);

    // Verificar cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
      console.log('👁️ [UpdateNotifier] Cambio de visibilidad detectado:', document.visibilityState);
      if (document.visibilityState === 'visible') {
        console.log('🔍 [UpdateNotifier] Pestaña visible, verificando actualizaciones...');
        checkForUpdate();
      }
    };

    // Verificar cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      console.log('🎯 [UpdateNotifier] Ventana enfocada, verificando actualizaciones...');
      checkForUpdate();
    };

    console.log('📺 [UpdateNotifier] Registrando event listeners...');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Escuchar mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      console.log('⚙️ [UpdateNotifier] Service Worker detectado, registrando listener...');
      const handleSWMessage = (event: MessageEvent) => {
        console.log('📨 [UpdateNotifier] Mensaje del Service Worker recibido:', event.data);
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('🚨 [UpdateNotifier] Service Worker reporta actualización disponible');
          checkForUpdate();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      return () => {
        console.log('🧹 [UpdateNotifier] Limpiando listeners (con Service Worker)...');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    } else {
      console.log('❌ [UpdateNotifier] Service Worker no disponible');
    }

    return () => {
      console.log('🧹 [UpdateNotifier] Limpiando listeners (sin Service Worker)...');
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

