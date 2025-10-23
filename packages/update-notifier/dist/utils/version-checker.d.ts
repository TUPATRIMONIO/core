/**
 * Version Checker Utility
 * Maneja la comparación y gestión de versiones para detectar actualizaciones
 */
export interface VersionInfo {
    version: string;
    buildId: string;
    deployedAt: string;
}
/**
 * Obtiene la versión actual almacenada en localStorage
 */
export declare function getCurrentVersion(): VersionInfo | null;
/**
 * Guarda la versión actual en localStorage
 */
export declare function setCurrentVersion(version: VersionInfo): void;
/**
 * Compara dos versiones y retorna true si son diferentes
 */
export declare function hasVersionChanged(current: VersionInfo | null, latest: VersionInfo): boolean;
/**
 * Verifica si el usuario ya descartó esta actualización
 */
export declare function isUpdateDismissed(version: string): boolean;
/**
 * Marca una actualización como descartada
 */
export declare function dismissUpdate(version: string): void;
/**
 * Limpia el caché del navegador antes de recargar
 */
export declare function clearCacheAndReload(): Promise<void>;
/**
 * Obtiene la versión más reciente desde el servidor
 */
export declare function fetchLatestVersion(): Promise<VersionInfo | null>;
