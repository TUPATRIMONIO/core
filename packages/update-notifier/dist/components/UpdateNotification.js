"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotification = UpdateNotification;
/**
 * Componente de notificación de actualización
 * Muestra una notificación en la esquina superior derecha cuando hay una nueva versión
 */
const react_1 = __importStar(require("react"));
const useUpdateDetection_1 = require("../hooks/useUpdateDetection");
const COUNTDOWN_SECONDS = 10;
function UpdateNotification() {
    const { hasUpdate, newVersion, dismissUpdate, applyUpdate } = (0, useUpdateDetection_1.useUpdateDetection)();
    const [countdown, setCountdown] = (0, react_1.useState)(COUNTDOWN_SECONDS);
    const [isVisible, setIsVisible] = (0, react_1.useState)(false);
    // Manejar countdown
    (0, react_1.useEffect)(() => {
        if (hasUpdate) {
            setIsVisible(true);
            setCountdown(COUNTDOWN_SECONDS);
        }
    }, [hasUpdate]);
    (0, react_1.useEffect)(() => {
        if (!isVisible || !hasUpdate)
            return;
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    applyUpdate();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isVisible, hasUpdate, applyUpdate]);
    const handleUpdateNow = () => {
        applyUpdate();
    };
    const handleDismiss = () => {
        setIsVisible(false);
        dismissUpdate();
    };
    const handlePostpone = () => {
        setIsVisible(false);
        // No llamar dismissUpdate aquí para que vuelva a aparecer en la siguiente verificación
    };
    if (!isVisible || !hasUpdate)
        return null;
    const progress = ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100;
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("style", { dangerouslySetInnerHTML: {
                __html: `
          @keyframes tp-slide-in {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .tp-animate-slide-in {
            animation: tp-slide-in 0.3s ease-out;
          }
        `
            } }),
        react_1.default.createElement("div", { className: "fixed top-4 right-4 z-50 w-96 bg-[var(--tp-background-light)] rounded-lg shadow-lg border border-[var(--tp-lines-30)] overflow-hidden tp-animate-slide-in", role: "alert", "aria-live": "assertive" },
            react_1.default.createElement("div", { className: "h-1 bg-[var(--tp-lines-20)]" },
                react_1.default.createElement("div", { className: "h-full bg-[var(--tp-brand)] transition-all duration-1000 ease-linear", style: { width: `${progress}%` } })),
            react_1.default.createElement("div", { className: "p-4" },
                react_1.default.createElement("div", { className: "flex items-start justify-between mb-3" },
                    react_1.default.createElement("div", { className: "flex items-center gap-2" },
                        react_1.default.createElement("svg", { className: "w-5 h-5 text-[var(--tp-brand)]", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor" },
                            react_1.default.createElement("path", { d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })),
                        react_1.default.createElement("h3", { className: "font-semibold text-[var(--tp-background-dark)] font-quicksand" }, "Nueva versi\u00F3n disponible")),
                    react_1.default.createElement("button", { onClick: handleDismiss, className: "text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors", "aria-label": "Cerrar notificaci\u00F3n" },
                        react_1.default.createElement("svg", { className: "w-5 h-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                            react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" })))),
                react_1.default.createElement("p", { className: "text-sm text-[var(--tp-lines)] mb-4 font-quicksand" },
                    "Hay una actualizaci\u00F3n disponible. La p\u00E1gina se actualizar\u00E1 autom\u00E1ticamente en",
                    ' ',
                    react_1.default.createElement("span", { className: "font-semibold text-[var(--tp-brand)]" }, countdown),
                    " segundo",
                    countdown !== 1 ? 's' : '',
                    "."),
                newVersion && (react_1.default.createElement("div", { className: "text-xs text-[var(--tp-lines-60)] mb-4 p-2 bg-[var(--tp-bg-light-50)] rounded font-quicksand" },
                    react_1.default.createElement("div", null,
                        "Versi\u00F3n actual: ",
                        newVersion.version),
                    react_1.default.createElement("div", { className: "text-[10px] mt-1" },
                        "Desplegado: ",
                        new Date(newVersion.deployedAt).toLocaleString('es-CL')))),
                react_1.default.createElement("div", { className: "flex gap-2" },
                    react_1.default.createElement("button", { onClick: handleUpdateNow, className: "flex-1 px-4 py-2 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white rounded-md text-sm font-medium transition-colors font-quicksand" }, "Actualizar ahora"),
                    react_1.default.createElement("button", { onClick: handlePostpone, className: "flex-1 px-4 py-2 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white rounded-md text-sm font-medium transition-colors font-quicksand" }, "Posponer"))))));
}
