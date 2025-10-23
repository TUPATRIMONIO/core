import { VersionInfo, VersionCheckConfig } from '../utils/versionUtils';
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
export declare function useVersionCheck(config?: VersionCheckConfig): UseVersionCheckResult;
