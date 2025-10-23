"use strict";
/**
 * Hook para detectar actualizaciones de la aplicación
 * Verifica cada 5 minutos y cuando el usuario regresa a la pestaña
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdateDetection = useUpdateDetection;
const react_1 = require("react");
const version_checker_1 = require("../utils/version-checker");
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
function useUpdateDetection() {
    const [hasUpdate, setHasUpdate] = (0, react_1.useState)(false);
    const [currentVersion, setCurrentVersionState] = (0, react_1.useState)(null);
    const [newVersion, setNewVersion] = (0, react_1.useState)(null);
    const checkingRef = (0, react_1.useRef)(false);
    const intervalRef = (0, react_1.useRef)();
    /**
     * Verifica si hay una nueva versión disponible
     */
    const checkForUpdate = (0, react_1.useCallback)(async () => {
        // Evitar múltiples checks simultáneos
        if (checkingRef.current)
            return;
        checkingRef.current = true;
        try {
            const latest = await (0, version_checker_1.fetchLatestVersion)();
            if (!latest) {
                checkingRef.current = false;
                return;
            }
            const current = (0, version_checker_1.getCurrentVersion)();
            // Si es la primera vez, solo guardar la versión
            if (!current) {
                (0, version_checker_1.setCurrentVersion)(latest);
                setCurrentVersionState(latest);
                checkingRef.current = false;
                return;
            }
            // Verificar si hay cambios
            if ((0, version_checker_1.hasVersionChanged)(current, latest)) {
                // Verificar si el usuario ya descartó esta actualización
                if (!(0, version_checker_1.isUpdateDismissed)(latest.version)) {
                    setNewVersion(latest);
                    setCurrentVersionState(current);
                    setHasUpdate(true);
                }
            }
        }
        catch (error) {
            console.error('Error checking for updates:', error);
        }
        finally {
            checkingRef.current = false;
        }
    }, []);
    /**
     * Descarta la actualización actual
     */
    const handleDismissUpdate = (0, react_1.useCallback)(() => {
        if (newVersion) {
            (0, version_checker_1.dismissUpdate)(newVersion.version);
            setHasUpdate(false);
            setNewVersion(null);
        }
    }, [newVersion]);
    /**
     * Aplica la actualización limpiando caché y recargando
     */
    const handleApplyUpdate = (0, react_1.useCallback)(async () => {
        if (newVersion) {
            (0, version_checker_1.setCurrentVersion)(newVersion);
            await (0, version_checker_1.clearCacheAndReload)();
        }
    }, [newVersion]);
    /**
     * Configurar verificación periódica y listeners
     */
    (0, react_1.useEffect)(() => {
        // Check inicial
        checkForUpdate();
        // Verificar cada 5 minutos
        intervalRef.current = setInterval(checkForUpdate, CHECK_INTERVAL);
        // Verificar cuando el usuario regresa a la pestaña
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForUpdate();
            }
        };
        // Verificar cuando la ventana vuelve a tener foco
        const handleFocus = () => {
            checkForUpdate();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        // Escuchar mensajes del Service Worker
        if ('serviceWorker' in navigator) {
            const handleSWMessage = (event) => {
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    checkForUpdate();
                }
            };
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleFocus);
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            };
        }
        return () => {
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
