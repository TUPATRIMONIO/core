"use strict";
/**
 * Version Checker Utility
 * Maneja la comparación y gestión de versiones para detectar actualizaciones
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentVersion = getCurrentVersion;
exports.setCurrentVersion = setCurrentVersion;
exports.hasVersionChanged = hasVersionChanged;
exports.isUpdateDismissed = isUpdateDismissed;
exports.dismissUpdate = dismissUpdate;
exports.clearCacheAndReload = clearCacheAndReload;
exports.fetchLatestVersion = fetchLatestVersion;
const STORAGE_KEY = 'tp-app-version';
const DISMISSED_KEY = 'tp-update-dismissed';
/**
 * DEBUGGING UTILITIES - Solo disponibles en development
 * Consola limpia en producción, utilidades de testing en development
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.TuPatrimonioUpdateDebug = {
        /**
         * Fuerza mostrar el popup de actualización
         */
        forceShowUpdateNotification: () => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(DISMISSED_KEY);
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: '1000000000000',
                buildId: 'old-test-version',
                deployedAt: '2024-01-01T00:00:00.000Z'
            }));
            console.log('🧪 Versión antigua establecida. Recarga la página para ver el popup.');
        },
        /**
         * Muestra información de debugging
         */
        showDebugInfo: async () => {
            const current = localStorage.getItem(STORAGE_KEY);
            const dismissed = localStorage.getItem(DISMISSED_KEY);
            console.log('💾 Versión almacenada:', current ? JSON.parse(current) : null);
            console.log('🚫 Versión descartada:', dismissed);
            try {
                const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-cache' });
                const serverVersion = await response.json();
                console.log('🌐 Versión del servidor:', serverVersion);
                if (current) {
                    const currentParsed = JSON.parse(current);
                    const hasChanged = currentParsed.buildId !== serverVersion.buildId || currentParsed.version !== serverVersion.version;
                    console.log('🔄 ¿Hay cambios?', hasChanged);
                }
            }
            catch (error) {
                console.error('❌ Error al obtener versión del servidor:', error);
            }
        },
        /**
         * Limpia storage de actualizaciones
         */
        clearStorage: () => {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(DISMISSED_KEY);
            console.log('🧹 Storage de actualizaciones limpiado');
        }
    };
    console.log('🛠️ [DEV] Utilidades de debugging disponibles en: window.TuPatrimonioUpdateDebug');
}
/**
 * Obtiene la versión actual almacenada en localStorage
 */
function getCurrentVersion() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }
    catch (error) {
        console.error('Error reading current version:', error);
        return null;
    }
}
/**
 * Guarda la versión actual en localStorage
 */
function setCurrentVersion(version) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(version));
        // Limpiar dismissed cuando guardamos nueva versión
        localStorage.removeItem(DISMISSED_KEY);
    }
    catch (error) {
        console.error('Error saving current version:', error);
    }
}
/**
 * Compara dos versiones y retorna true si son diferentes
 */
function hasVersionChanged(current, latest) {
    if (!current)
        return false;
    // Comparar por buildId o version
    return current.buildId !== latest.buildId || current.version !== latest.version;
}
/**
 * Verifica si el usuario ya descartó esta actualización
 */
function isUpdateDismissed(version) {
    try {
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        return dismissed === version;
    }
    catch (error) {
        return false;
    }
}
/**
 * Marca una actualización como descartada
 */
function dismissUpdate(version) {
    try {
        localStorage.setItem(DISMISSED_KEY, version);
    }
    catch (error) {
        console.error('Error dismissing update:', error);
    }
}
/**
 * Limpia el caché del navegador antes de recargar
 */
async function clearCacheAndReload() {
    try {
        // Limpiar Service Worker caches si está disponible
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }
        // Desregistrar Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(registration => registration.unregister()));
        }
        // Recargar la página con hard reload
        window.location.reload();
    }
    catch (error) {
        console.error('Error clearing cache:', error);
        // Intentar reload normal si falla
        window.location.reload();
    }
}
/**
 * Obtiene la versión más reciente desde el servidor
 */
async function fetchLatestVersion() {
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
        return data;
    }
    catch (error) {
        console.error('Error fetching latest version:', error);
        return null;
    }
}
