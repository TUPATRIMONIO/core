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
    const response = await fetch(`/version.json?t=${timestamp}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as VersionInfo;
  } catch (error) {
    console.error('Error fetching latest version:', error);
    return null;
  }
}

