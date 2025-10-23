"use strict";
/**
 * Utilidades para el manejo de versiones en TuPatrimonio Apps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBuildId = generateBuildId;
exports.getCurrentVersion = getCurrentVersion;
exports.setCurrentVersion = setCurrentVersion;
exports.fetchServerVersion = fetchServerVersion;
exports.hasNewVersion = hasNewVersion;
exports.shouldEnableVersionCheck = shouldEnableVersionCheck;
exports.isVersionDismissed = isVersionDismissed;
exports.dismissVersion = dismissVersion;
exports.reloadWithCacheBust = reloadWithCacheBust;
exports.initializeVersion = initializeVersion;
const DEFAULT_CONFIG = {
    checkIntervalMs: 5 * 60 * 1000, // 5 minutos
    enableOnlyInProduction: true,
    versionEndpoint: '/version.json'
};
/**
 * Genera un ID único para el build basado en timestamp
 */
function generateBuildId(timestamp) {
    return `build-${timestamp}`;
}
/**
 * Obtiene la información de versión actual del localStorage
 */
function getCurrentVersion() {
    if (typeof window === 'undefined')
        return null;
    try {
        const stored = localStorage.getItem('tupatrimonio-version');
        return stored ? JSON.parse(stored) : null;
    }
    catch {
        return null;
    }
}
/**
 * Guarda la información de versión actual en localStorage
 */
function setCurrentVersion(version) {
    if (typeof window === 'undefined')
        return;
    try {
        localStorage.setItem('tupatrimonio-version', JSON.stringify(version));
    }
    catch {
        // Ignorar errores de localStorage
    }
}
/**
 * Obtiene la información de versión del servidor
 */
async function fetchServerVersion(endpoint = DEFAULT_CONFIG.versionEndpoint) {
    try {
        const response = await fetch(endpoint + '?t=' + Date.now(), {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch version: ${response.status}`);
        }
        const data = await response.json();
        return {
            timestamp: data.timestamp || Date.now(),
            buildId: data.buildId || generateBuildId(data.timestamp || Date.now()),
            version: data.version || '1.0.0'
        };
    }
    catch (error) {
        console.warn('Failed to fetch server version:', error);
        return null;
    }
}
/**
 * Compara dos versiones y determina si hay una nueva
 */
function hasNewVersion(current, server) {
    if (!current)
        return false;
    return server.timestamp > current.timestamp;
}
/**
 * Verifica si el sistema debe estar habilitado
 */
function shouldEnableVersionCheck(config = {}) {
    const { enableOnlyInProduction } = { ...DEFAULT_CONFIG, ...config };
    if (typeof window === 'undefined')
        return false;
    return enableOnlyInProduction
        ? (typeof process !== 'undefined' && process.env.NODE_ENV === 'production')
        : true;
}
/**
 * Verifica si una versión específica ya fue dismisseada por el usuario
 */
function isVersionDismissed(buildId) {
    if (typeof window === 'undefined')
        return false;
    try {
        const dismissed = localStorage.getItem('tupatrimonio-dismissed-versions');
        const dismissedList = dismissed ? JSON.parse(dismissed) : [];
        return dismissedList.includes(buildId);
    }
    catch {
        return false;
    }
}
/**
 * Marca una versión como dismisseada
 */
function dismissVersion(buildId) {
    if (typeof window === 'undefined')
        return;
    try {
        const dismissed = localStorage.getItem('tupatrimonio-dismissed-versions');
        const dismissedList = dismissed ? JSON.parse(dismissed) : [];
        if (!dismissedList.includes(buildId)) {
            dismissedList.push(buildId);
            // Mantener solo los últimos 10 dismissals
            if (dismissedList.length > 10) {
                dismissedList.shift();
            }
            localStorage.setItem('tupatrimonio-dismissed-versions', JSON.stringify(dismissedList));
        }
    }
    catch {
        // Ignorar errores de localStorage
    }
}
/**
 * Recarga la aplicación forzando limpieza de caché
 */
function reloadWithCacheBust() {
    if (typeof window === 'undefined')
        return;
    // Limpiar service worker cache si existe
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.update();
            });
        });
    }
    // Forzar recarga completa
    window.location.reload();
}
/**
 * Configura la versión inicial desde los meta tags o parámetros de build
 */
function initializeVersion() {
    if (typeof window === 'undefined')
        return null;
    try {
        // Intentar obtener desde meta tags generados en build time
        const timestampMeta = document.querySelector('meta[name="build-timestamp"]');
        const versionMeta = document.querySelector('meta[name="app-version"]');
        const timestamp = timestampMeta
            ? parseInt(timestampMeta.getAttribute('content') || '0')
            : Date.now();
        const version = versionMeta
            ? versionMeta.getAttribute('content') || '1.0.0'
            : '1.0.0';
        const buildId = generateBuildId(timestamp);
        const versionInfo = {
            timestamp,
            buildId,
            version
        };
        // Guardar como versión actual si no existe
        if (!getCurrentVersion()) {
            setCurrentVersion(versionInfo);
        }
        return versionInfo;
    }
    catch {
        return null;
    }
}
