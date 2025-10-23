"use strict";
/**
 * @tupatrimonio/update-notifier
 * Sistema unificado de notificaciones de actualización
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLatestVersion = exports.clearCacheAndReload = exports.dismissUpdate = exports.isUpdateDismissed = exports.hasVersionChanged = exports.setCurrentVersion = exports.getCurrentVersion = exports.useUpdateDetection = exports.UpdateNotification = void 0;
var UpdateNotification_1 = require("./components/UpdateNotification");
Object.defineProperty(exports, "UpdateNotification", { enumerable: true, get: function () { return UpdateNotification_1.UpdateNotification; } });
var useUpdateDetection_1 = require("./hooks/useUpdateDetection");
Object.defineProperty(exports, "useUpdateDetection", { enumerable: true, get: function () { return useUpdateDetection_1.useUpdateDetection; } });
var version_checker_1 = require("./utils/version-checker");
Object.defineProperty(exports, "getCurrentVersion", { enumerable: true, get: function () { return version_checker_1.getCurrentVersion; } });
Object.defineProperty(exports, "setCurrentVersion", { enumerable: true, get: function () { return version_checker_1.setCurrentVersion; } });
Object.defineProperty(exports, "hasVersionChanged", { enumerable: true, get: function () { return version_checker_1.hasVersionChanged; } });
Object.defineProperty(exports, "isUpdateDismissed", { enumerable: true, get: function () { return version_checker_1.isUpdateDismissed; } });
Object.defineProperty(exports, "dismissUpdate", { enumerable: true, get: function () { return version_checker_1.dismissUpdate; } });
Object.defineProperty(exports, "clearCacheAndReload", { enumerable: true, get: function () { return version_checker_1.clearCacheAndReload; } });
Object.defineProperty(exports, "fetchLatestVersion", { enumerable: true, get: function () { return version_checker_1.fetchLatestVersion; } });
