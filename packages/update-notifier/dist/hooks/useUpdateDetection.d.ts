/**
 * Hook para detectar actualizaciones de la aplicación
 * Verifica cada 5 minutos y cuando el usuario regresa a la pestaña
 */
import { type VersionInfo } from '../utils/version-checker';
export interface UseUpdateDetectionResult {
    hasUpdate: boolean;
    currentVersion: VersionInfo | null;
    newVersion: VersionInfo | null;
    checkNow: () => Promise<void>;
    dismissUpdate: () => void;
    applyUpdate: () => Promise<void>;
}
export declare function useUpdateDetection(): UseUpdateDetectionResult;
