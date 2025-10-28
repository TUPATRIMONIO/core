/**
 * Version Checker Utility
 * Maneja la comparación y gestión de versiones para detectar actualizaciones
 */

export interface VersionInfo {
  version: string;
  buildId: string;
  deployedAt: string;
}

const STORAGE_KEY = 'tp-app-version';
const DISMISSED_KEY = 'tp-update-dismissed';

/**
 * DEBUGGING UTILITIES - Disponibles globalmente en la consola del navegador
 */

// Hacer funciones de debugging disponibles globalmente
if (typeof window !== 'undefined') {
  (window as any).TuPatrimonioUpdateDebug = {
    /**
     * Fuerza mostrar el popup de actualización con una versión falsa antigua
     */
    forceShowUpdateNotification: () => {
      console.log('🧪 [DEBUG] Forzando notificación de actualización...');
      
      // Limpiar storage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISMISSED_KEY);
      
      // Establecer versión muy antigua
      const oldVersion = {
        version: '1000000000000',
        buildId: 'old-test-version',
        deployedAt: '2024-01-01T00:00:00.000Z'
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(oldVersion));
      console.log('📀 [DEBUG] Versión antigua establecida:', oldVersion);
      console.log('🔄 [DEBUG] Recarga la página para ver el popup');
      
      return oldVersion;
    },
    
    /**
     * Muestra información de debugging actual
     */
    showDebugInfo: async () => {
      console.log('🔍 [DEBUG] === INFORMACIÓN DE DEBUGGING ===');
      
      const currentStored = localStorage.getItem(STORAGE_KEY);
      const dismissedVersion = localStorage.getItem(DISMISSED_KEY);
      
      console.log('💾 [DEBUG] Versión almacenada:', currentStored ? JSON.parse(currentStored) : null);
      console.log('🚫 [DEBUG] Versión descartada:', dismissedVersion);
      
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-cache' });
        const serverVersion = await response.json();
        console.log('🌐 [DEBUG] Versión del servidor:', serverVersion);
        
        if (currentStored) {
          const current = JSON.parse(currentStored);
          const hasChanged = current.buildId !== serverVersion.buildId || current.version !== serverVersion.version;
          console.log('🔄 [DEBUG] ¿Hay cambios?', hasChanged);
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error al obtener versión del servidor:', error);
      }
      
      console.log('🔍 [DEBUG] === FIN INFORMACIÓN ===');
    },
    
    /**
     * Limpia todo el storage relacionado con actualizaciones
     */
    clearUpdateStorage: () => {
      console.log('🧹 [DEBUG] Limpiando storage de actualizaciones...');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DISMISSED_KEY);
      console.log('✅ [DEBUG] Storage limpiado');
    },
    
    /**
     * Simula una versión específica
     */
    setTestVersion: (version: string, buildId: string) => {
      const testVersion = {
        version,
        buildId,
        deployedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(testVersion));
      console.log('🧪 [DEBUG] Versión de test establecida:', testVersion);
      return testVersion;
    }
  };
  
  console.log('🛠️ [UpdateNotifier] Funciones de debugging disponibles en: window.TuPatrimonioUpdateDebug');
  console.log('📝 [UpdateNotifier] Comandos disponibles:');
  console.log('   • TuPatrimonioUpdateDebug.forceShowUpdateNotification() - Fuerza mostrar popup');
  console.log('   • TuPatrimonioUpdateDebug.showDebugInfo() - Muestra info de debugging');
  console.log('   • TuPatrimonioUpdateDebug.clearUpdateStorage() - Limpia storage');
  console.log('   • TuPatrimonioUpdateDebug.setTestVersion("123", "abc") - Establece versión de test');
}

/**
 * Obtiene la versión actual almacenada en localStorage
 */
export function getCurrentVersion(): VersionInfo | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading current version:', error);
    return null;
  }
}

/**
 * Guarda la versión actual en localStorage
 */
export function setCurrentVersion(version: VersionInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(version));
    // Limpiar dismissed cuando guardamos nueva versión
    localStorage.removeItem(DISMISSED_KEY);
  } catch (error) {
    console.error('Error saving current version:', error);
  }
}

/**
 * Compara dos versiones y retorna true si son diferentes
 */
export function hasVersionChanged(current: VersionInfo | null, latest: VersionInfo): boolean {
  if (!current) return false;
  
  // Comparar por buildId o version
  return current.buildId !== latest.buildId || current.version !== latest.version;
}

/**
 * Verifica si el usuario ya descartó esta actualización
 */
export function isUpdateDismissed(version: string): boolean {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    return dismissed === version;
  } catch (error) {
    return false;
  }
}

/**
 * Marca una actualización como descartada
 */
export function dismissUpdate(version: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY, version);
  } catch (error) {
    console.error('Error dismissing update:', error);
  }
}

/**
 * Limpia el caché del navegador antes de recargar
 */
export async function clearCacheAndReload(): Promise<void> {
  try {
    // Limpiar Service Worker caches si está disponible
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }

    // Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(registration => registration.unregister())
      );
    }

    // Recargar la página con hard reload
    window.location.reload();
  } catch (error) {
    console.error('Error clearing cache:', error);
    // Intentar reload normal si falla
    window.location.reload();
  }
}

/**
 * Obtiene la versión más reciente desde el servidor
 */
export async function fetchLatestVersion(): Promise<VersionInfo | null> {
  try {
    // Añadir timestamp para evitar caché
    const timestamp = Date.now();
    const url = `/version.json?t=${timestamp}`;
    
    console.log('📡 [VersionChecker] Fetching desde:', url);
    console.log('🔧 [VersionChecker] Headers enviados:', {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    console.log('📊 [VersionChecker] Response status:', response.status);
    console.log('📋 [VersionChecker] Response headers:', {
      'Content-Type': response.headers.get('Content-Type'),
      'Cache-Control': response.headers.get('Cache-Control'),
      'ETag': response.headers.get('ETag'),
      'Last-Modified': response.headers.get('Last-Modified')
    });

    if (!response.ok) {
      console.error(`❌ [VersionChecker] HTTP Error! Status: ${response.status} ${response.statusText}`);
      console.error('📄 [VersionChecker] Response text:', await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📄 [VersionChecker] Raw response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ [VersionChecker] Parsed data:', data);
      
      // Validar estructura
      if (!data.version || !data.buildId || !data.deployedAt) {
        console.warn('⚠️ [VersionChecker] Datos incompletos:', data);
        console.warn('🔍 [VersionChecker] Se esperaba: { version, buildId, deployedAt }');
      }
      
      return data as VersionInfo;
    } catch (parseError) {
      console.error('❌ [VersionChecker] Error parsing JSON:', parseError);
      console.error('📄 [VersionChecker] Raw text was:', responseText);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    console.error('❌ [VersionChecker] Error fetching latest version:', error);
    console.error('🔍 [VersionChecker] Error details:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : typeof error
    });
    return null;
  }
}

