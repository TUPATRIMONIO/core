/**
 * @tupatrimonio/version
 *
 * Sistema de notificación de versiones nuevas para TuPatrimonio Apps
 *
 * Este package proporciona una solución completa para detectar automáticamente
 * nuevas versiones deployadas en Netlify y mostrar notificaciones al usuario
 * para recargar la aplicación y limpiar el caché.
 */
export { useVersionCheck } from './hooks/useVersionCheck';
export type { UseVersionCheckResult } from './hooks/useVersionCheck';
export { VersionNotification, useVersionNotification } from './components/VersionNotification';
export type { UseVersionNotificationOptions } from './components/VersionNotification';
export { generateBuildId, getCurrentVersion, setCurrentVersion, fetchServerVersion, hasNewVersion, shouldEnableVersionCheck, isVersionDismissed, dismissVersion, reloadWithCacheBust, initializeVersion } from './utils/versionUtils';
export type { VersionInfo, VersionCheckConfig } from './utils/versionUtils';
