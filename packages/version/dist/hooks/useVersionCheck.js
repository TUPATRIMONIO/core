"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVersionCheck = useVersionCheck;
const react_1 = require("react");
const versionUtils_1 = require("../utils/versionUtils");
function useVersionCheck(config = {}) {
    const [hasUpdate, setHasUpdate] = (0, react_1.useState)(false);
    const [newVersion, setNewVersion] = (0, react_1.useState)(null);
    const [isChecking, setIsChecking] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const intervalRef = (0, react_1.useRef)(undefined);
    const configRef = (0, react_1.useRef)(config);
    // Actualizar config ref cuando cambie
    configRef.current = config;
    const checkVersion = (0, react_1.useCallback)(async () => {
        if (!(0, versionUtils_1.shouldEnableVersionCheck)(configRef.current)) {
            return;
        }
        setIsChecking(true);
        setError(null);
        try {
            const serverVersion = await (0, versionUtils_1.fetchServerVersion)(configRef.current.versionEndpoint);
            if (!serverVersion) {
                setError('No se pudo obtener información de la versión del servidor');
                return;
            }
            const currentVersion = (0, versionUtils_1.getCurrentVersion)();
            if ((0, versionUtils_1.hasNewVersion)(currentVersion, serverVersion)) {
                // Verificar si esta versión ya fue dismisseada
                if (!(0, versionUtils_1.isVersionDismissed)(serverVersion.buildId)) {
                    setNewVersion(serverVersion);
                    setHasUpdate(true);
                }
            }
            else {
                // No hay actualización, limpiar estado si había
                setHasUpdate(false);
                setNewVersion(null);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido al verificar versión');
            console.error('Version check error:', err);
        }
        finally {
            setIsChecking(false);
        }
    }, []);
    const dismissUpdate = (0, react_1.useCallback)(() => {
        if (newVersion) {
            (0, versionUtils_1.dismissVersion)(newVersion.buildId);
            setHasUpdate(false);
            setNewVersion(null);
        }
    }, [newVersion]);
    const applyUpdate = (0, react_1.useCallback)(() => {
        if (newVersion) {
            // Actualizar la versión almacenada antes de recargar
            (0, versionUtils_1.setCurrentVersion)(newVersion);
            (0, versionUtils_1.reloadWithCacheBust)();
        }
    }, [newVersion]);
    const checkNow = (0, react_1.useCallback)(() => {
        checkVersion();
    }, [checkVersion]);
    // Configurar interval para verificaciones automáticas
    (0, react_1.useEffect)(() => {
        if (!(0, versionUtils_1.shouldEnableVersionCheck)(configRef.current)) {
            return;
        }
        const intervalMs = configRef.current.checkIntervalMs || 5 * 60 * 1000; // 5 minutos por defecto
        // Verificación inicial
        checkVersion();
        // Configurar interval
        intervalRef.current = setInterval(checkVersion, intervalMs);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [checkVersion]);
    // Verificar cuando la ventana recupera el focus
    (0, react_1.useEffect)(() => {
        if (!(0, versionUtils_1.shouldEnableVersionCheck)(configRef.current)) {
            return;
        }
        const handleFocus = () => {
            checkVersion();
        };
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
            }
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [checkVersion]);
    // Inicializar versión al montar el componente
    (0, react_1.useEffect)(() => {
        if ((0, versionUtils_1.shouldEnableVersionCheck)(configRef.current)) {
            (0, versionUtils_1.initializeVersion)();
        }
    }, []);
    return {
        hasUpdate,
        newVersion,
        isChecking,
        error,
        dismissUpdate,
        applyUpdate,
        checkNow
    };
}
