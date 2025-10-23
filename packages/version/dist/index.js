"use strict";
/**
 * @tupatrimonio/version
 *
 * Sistema de notificación de versiones nuevas para TuPatrimonio Apps
 *
 * Este package proporciona una solución completa para detectar automáticamente
 * nuevas versiones deployadas en Netlify y mostrar notificaciones al usuario
 * para recargar la aplicación y limpiar el caché.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeVersion = exports.reloadWithCacheBust = exports.dismissVersion = exports.isVersionDismissed = exports.shouldEnableVersionCheck = exports.hasNewVersion = exports.fetchServerVersion = exports.setCurrentVersion = exports.getCurrentVersion = exports.generateBuildId = exports.useVersionNotification = exports.VersionNotification = exports.useVersionCheck = void 0;
// Hooks principales
var useVersionCheck_1 = require("./hooks/useVersionCheck");
Object.defineProperty(exports, "useVersionCheck", { enumerable: true, get: function () { return useVersionCheck_1.useVersionCheck; } });
// Componentes UI
var VersionNotification_1 = require("./components/VersionNotification");
Object.defineProperty(exports, "VersionNotification", { enumerable: true, get: function () { return VersionNotification_1.VersionNotification; } });
Object.defineProperty(exports, "useVersionNotification", { enumerable: true, get: function () { return VersionNotification_1.useVersionNotification; } });
// Utilidades y tipos
var versionUtils_1 = require("./utils/versionUtils");
Object.defineProperty(exports, "generateBuildId", { enumerable: true, get: function () { return versionUtils_1.generateBuildId; } });
Object.defineProperty(exports, "getCurrentVersion", { enumerable: true, get: function () { return versionUtils_1.getCurrentVersion; } });
Object.defineProperty(exports, "setCurrentVersion", { enumerable: true, get: function () { return versionUtils_1.setCurrentVersion; } });
Object.defineProperty(exports, "fetchServerVersion", { enumerable: true, get: function () { return versionUtils_1.fetchServerVersion; } });
Object.defineProperty(exports, "hasNewVersion", { enumerable: true, get: function () { return versionUtils_1.hasNewVersion; } });
Object.defineProperty(exports, "shouldEnableVersionCheck", { enumerable: true, get: function () { return versionUtils_1.shouldEnableVersionCheck; } });
Object.defineProperty(exports, "isVersionDismissed", { enumerable: true, get: function () { return versionUtils_1.isVersionDismissed; } });
Object.defineProperty(exports, "dismissVersion", { enumerable: true, get: function () { return versionUtils_1.dismissVersion; } });
Object.defineProperty(exports, "reloadWithCacheBust", { enumerable: true, get: function () { return versionUtils_1.reloadWithCacheBust; } });
Object.defineProperty(exports, "initializeVersion", { enumerable: true, get: function () { return versionUtils_1.initializeVersion; } });
