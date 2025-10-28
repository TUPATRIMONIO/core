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
        console.log('🔍 [UpdateNotifier] Iniciando verificación de actualizaciones...');
        // Evitar múltiples checks simultáneos
        if (checkingRef.current) {
            console.log('⏭️ [UpdateNotifier] Ya hay un check en progreso, saltando...');
            return;
        }
        checkingRef.current = true;
        console.log('🚀 [UpdateNotifier] Verificación iniciada');
        try {
            console.log('📡 [UpdateNotifier] Fetching versión del servidor...');
            const latest = await (0, version_checker_1.fetchLatestVersion)();
            console.log('📥 [UpdateNotifier] Versión del servidor:', latest);
            if (!latest) {
                console.warn('⚠️ [UpdateNotifier] No se pudo obtener la versión del servidor');
                checkingRef.current = false;
                return;
            }
            const current = (0, version_checker_1.getCurrentVersion)();
            console.log('💾 [UpdateNotifier] Versión local almacenada:', current);
            // Si es la primera vez, solo guardar la versión
            if (!current) {
                console.log('🆕 [UpdateNotifier] Primera carga, guardando versión actual:', latest);
                (0, version_checker_1.setCurrentVersion)(latest);
                setCurrentVersionState(latest);
                checkingRef.current = false;
                return;
            }
            // Verificar si hay cambios
            const versionChanged = (0, version_checker_1.hasVersionChanged)(current, latest);
            console.log('🔄 [UpdateNotifier] ¿Versión cambió?', versionChanged);
            console.log('📊 [UpdateNotifier] Comparación detallada:', {
                currentVersion: current.version,
                currentBuildId: current.buildId,
                latestVersion: latest.version,
                latestBuildId: latest.buildId
            });
            if (versionChanged) {
                const dismissed = (0, version_checker_1.isUpdateDismissed)(latest.version);
                console.log('🚫 [UpdateNotifier] ¿Update descartado por el usuario?', dismissed);
                if (!dismissed) {
                    console.log('🎉 [UpdateNotifier] ¡NUEVA VERSIÓN DETECTADA! Mostrando popup...');
                    setNewVersion(latest);
                    setCurrentVersionState(current);
                    setHasUpdate(true);
                }
                else {
                    console.log('🤐 [UpdateNotifier] Update descartado previamente, no mostrando popup');
                }
            }
            else {
                console.log('✅ [UpdateNotifier] No hay cambios, versión actual');
            }
        }
        catch (error) {
            console.error('❌ [UpdateNotifier] Error durante verificación:', error);
            console.error('📄 [UpdateNotifier] Detalles del error:', {
                message: error instanceof Error ? error.message : 'Error desconocido',
                stack: error instanceof Error ? error.stack : undefined
            });
        }
        finally {
            checkingRef.current = false;
            console.log('🏁 [UpdateNotifier] Verificación finalizada');
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
        console.log('🎯 [UpdateNotifier] Inicializando hook useUpdateDetection...');
        // Check inicial
        console.log('⏰ [UpdateNotifier] Ejecutando verificación inicial...');
        checkForUpdate();
        // Verificar cada 5 minutos
        console.log(`⏱️ [UpdateNotifier] Configurando intervalo de verificación cada ${CHECK_INTERVAL / 60000} minutos`);
        intervalRef.current = setInterval(() => {
            console.log('🕒 [UpdateNotifier] Ejecutando verificación programada...');
            checkForUpdate();
        }, CHECK_INTERVAL);
        // Verificar cuando el usuario regresa a la pestaña
        const handleVisibilityChange = () => {
            console.log('👁️ [UpdateNotifier] Cambio de visibilidad detectado:', document.visibilityState);
            if (document.visibilityState === 'visible') {
                console.log('🔍 [UpdateNotifier] Pestaña visible, verificando actualizaciones...');
                checkForUpdate();
            }
        };
        // Verificar cuando la ventana vuelve a tener foco
        const handleFocus = () => {
            console.log('🎯 [UpdateNotifier] Ventana enfocada, verificando actualizaciones...');
            checkForUpdate();
        };
        console.log('📺 [UpdateNotifier] Registrando event listeners...');
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        // Escuchar mensajes del Service Worker
        if ('serviceWorker' in navigator) {
            console.log('⚙️ [UpdateNotifier] Service Worker detectado, registrando listener...');
            const handleSWMessage = (event) => {
                console.log('📨 [UpdateNotifier] Mensaje del Service Worker recibido:', event.data);
                if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                    console.log('🚨 [UpdateNotifier] Service Worker reporta actualización disponible');
                    checkForUpdate();
                }
            };
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
            return () => {
                console.log('🧹 [UpdateNotifier] Limpiando listeners (con Service Worker)...');
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleFocus);
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            };
        }
        else {
            console.log('❌ [UpdateNotifier] Service Worker no disponible');
        }
        return () => {
            console.log('🧹 [UpdateNotifier] Limpiando listeners (sin Service Worker)...');
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
