/**
 * @tupatrimonio/update-notifier
 * Sistema unificado de notificaciones de actualización
 */

export { UpdateNotification } from './components/UpdateNotification';
export { useUpdateDetection } from './hooks/useUpdateDetection';
export type { UseUpdateDetectionResult } from './hooks/useUpdateDetection';
export type { VersionInfo } from './utils/version-checker';
export {
  getCurrentVersion,
  setCurrentVersion,
  hasVersionChanged,
  isUpdateDismissed,
  dismissUpdate,
  clearCacheAndReload,
  fetchLatestVersion,
} from './utils/version-checker';

