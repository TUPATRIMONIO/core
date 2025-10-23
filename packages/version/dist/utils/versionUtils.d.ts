/**
 * Utilidades para el manejo de versiones en TuPatrimonio Apps
 */
export interface VersionInfo {
    timestamp: number;
    buildId: string;
    version: string;
}
export interface VersionCheckConfig {
    checkIntervalMs?: number;
    enableOnlyInProduction?: boolean;
    versionEndpoint?: string;
}
/**
 * Genera un ID único para el build basado en timestamp
 */
export declare function generateBuildId(timestamp: number): string;
/**
 * Obtiene la información de versión actual del localStorage
 */
export declare function getCurrentVersion(): VersionInfo | null;
/**
 * Guarda la información de versión actual en localStorage
 */
export declare function setCurrentVersion(version: VersionInfo): void;
/**
 * Obtiene la información de versión del servidor
 */
export declare function fetchServerVersion(endpoint?: string): Promise<VersionInfo | null>;
/**
 * Compara dos versiones y determina si hay una nueva
 */
export declare function hasNewVersion(current: VersionInfo | null, server: VersionInfo): boolean;
/**
 * Verifica si el sistema debe estar habilitado
 */
export declare function shouldEnableVersionCheck(config?: VersionCheckConfig): boolean;
/**
 * Verifica si una versión específica ya fue dismisseada por el usuario
 */
export declare function isVersionDismissed(buildId: string): boolean;
/**
 * Marca una versión como dismisseada
 */
export declare function dismissVersion(buildId: string): void;
/**
 * Recarga la aplicación forzando limpieza de caché
 */
export declare function reloadWithCacheBust(): void;
/**
 * Configura la versión inicial desde los meta tags o parámetros de build
 */
export declare function initializeVersion(): VersionInfo | null;
