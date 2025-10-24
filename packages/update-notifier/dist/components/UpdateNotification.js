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
 * Usa componentes de shadcn/ui para un diseño profesional
 */
const react_1 = __importStar(require("react"));
const useUpdateDetection_1 = require("../hooks/useUpdateDetection");
const ui_1 = require("@tupatrimonio/ui");
const ui_2 = require("@tupatrimonio/ui");
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

          @keyframes tp-pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }

          .tp-animate-slide-in {
            animation: tp-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .tp-pulse {
            animation: tp-pulse 2s ease-in-out infinite;
          }
        `
            } }),
        react_1.default.createElement("div", { className: "fixed top-4 right-4 z-50 w-full max-w-md tp-animate-slide-in" },
            react_1.default.createElement(ui_1.Alert, { className: "bg-[var(--tp-background-light)] border-[var(--tp-brand-20)] shadow-xl" },
                react_1.default.createElement("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--tp-lines-10)] rounded-t-lg overflow-hidden" },
                    react_1.default.createElement("div", { className: "h-full bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] transition-all duration-1000 ease-linear", style: { width: `${progress}%` } })),
                react_1.default.createElement("div", { className: "relative flex-shrink-0" },
                    react_1.default.createElement("div", { className: "absolute inset-0 bg-[var(--tp-brand-10)] rounded-full blur-md tp-pulse" }),
                    react_1.default.createElement("svg", { className: "text-[var(--tp-brand)] relative z-10", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor" },
                        react_1.default.createElement("path", { d: "M13 10V3L4 14h7v7l9-11h-7z" }))),
                react_1.default.createElement("button", { onClick: handleDismiss, className: "absolute top-3 right-3 text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors p-1 rounded-md hover:bg-[var(--tp-bg-light-50)]", "aria-label": "Cerrar notificaci\u00F3n" },
                    react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                        react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }))),
                react_1.default.createElement(ui_1.AlertTitle, { className: "text-[var(--tp-background-dark)] font-quicksand text-base mb-2 pr-6" }, "Nueva versi\u00F3n disponible"),
                react_1.default.createElement(ui_1.AlertDescription, { className: "text-[var(--tp-lines)] space-y-3" },
                    react_1.default.createElement("p", null,
                        "Hay una actualizaci\u00F3n disponible. La p\u00E1gina se actualizar\u00E1 autom\u00E1ticamente en",
                        ' ',
                        react_1.default.createElement("span", { className: "font-semibold text-[var(--tp-brand)]" }, countdown),
                        ' ',
                        "segundo",
                        countdown !== 1 ? 's' : '',
                        "."),
                    react_1.default.createElement("div", { className: "flex gap-2 pt-1" },
                        react_1.default.createElement(ui_2.Button, { onClick: handleUpdateNow, variant: "default", size: "sm", className: "flex-1 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white" },
                            react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                                react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })),
                            "Actualizar ahora"),
                        react_1.default.createElement(ui_2.Button, { onClick: handlePostpone, variant: "outline", size: "sm", className: "flex-1 border-[var(--tp-lines-30)] hover:bg-[var(--tp-bg-light-50)] hover:border-[var(--tp-lines-50)] text-[var(--tp-background-dark)]" },
                            react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                                react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })),
                            "Posponer")))))));
}
