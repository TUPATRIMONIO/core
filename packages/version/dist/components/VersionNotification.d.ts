import { UseVersionCheckResult } from '../hooks/useVersionCheck';
interface VersionNotificationProps {
    versionCheck: UseVersionCheckResult;
    className?: string;
}
/**
 * Componente de notificación que aparece cuando hay una nueva versión disponible
 * Utiliza el design system de TuPatrimonio con variables CSS personalizadas
 */
export declare function VersionNotification({ versionCheck, className }: VersionNotificationProps): import("react/jsx-runtime").JSX.Element | null;
/**
 * Hook personalizado para integrar fácilmente el sistema de versiones
 * Combina useVersionCheck con el componente de notificación
 */
export interface UseVersionNotificationOptions {
    checkIntervalMs?: number;
    enableOnlyInProduction?: boolean;
    versionEndpoint?: string;
    className?: string;
}
export declare function useVersionNotification(options?: UseVersionNotificationOptions): {
    checkIntervalMs?: number;
    enableOnlyInProduction?: boolean;
    versionEndpoint?: string;
    className?: string;
};
export default VersionNotification;
