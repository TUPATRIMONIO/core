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
const COUNTDOWN_SECONDS = 10;
// Componentes shadcn/ui inline para evitar dependencias
// En producción, estos se importarían desde @/components/ui
const Alert = ({ className = '', children, ...props }) => (react_1.default.createElement("div", { role: "alert", className: `relative w-full rounded-lg border px-4 py-3 text-sm ${className}`, ...props }, children));
const AlertTitle = ({ className = '', children, ...props }) => (react_1.default.createElement("h5", { className: `mb-1 font-medium leading-none tracking-tight ${className}`, ...props }, children));
const AlertDescription = ({ className = '', children, ...props }) => (react_1.default.createElement("div", { className: `text-sm [&_p]:leading-relaxed ${className}`, ...props }, children));
const Button = ({ className = '', variant = 'default', children, ...props }) => {
    const variants = {
        default: 'bg-[var(--tp-buttons)] text-white hover:bg-[var(--tp-buttons-hover)] focus-visible:ring-ring focus-visible:ring-[3px]',
        outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
    };
    return (react_1.default.createElement("button", { className: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 outline-none ${variants[variant]} ${className}`, ...props }, children));
};
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
        react_1.default.createElement("div", { className: "fixed top-4 right-4 z-50 w-[420px] tp-animate-slide-in" },
            react_1.default.createElement(Alert, { className: "bg-[var(--tp-background-light)] border-[var(--tp-brand-20)] shadow-xl backdrop-blur-sm" },
                react_1.default.createElement("div", { className: "absolute top-0 left-0 right-0 h-1 bg-[var(--tp-lines-10)] rounded-t-lg overflow-hidden" },
                    react_1.default.createElement("div", { className: "h-full bg-gradient-to-r from-[var(--tp-brand)] to-[var(--tp-brand-light)] transition-all duration-1000 ease-linear", style: { width: `${progress}%` } })),
                react_1.default.createElement("div", { className: "flex items-start gap-3 pt-2" },
                    react_1.default.createElement("div", { className: "flex-shrink-0 mt-0.5" },
                        react_1.default.createElement("div", { className: "relative" },
                            react_1.default.createElement("div", { className: "absolute inset-0 bg-[var(--tp-brand-10)] rounded-full blur-md tp-pulse" }),
                            react_1.default.createElement("svg", { className: "w-5 h-5 text-[var(--tp-brand)] relative z-10", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor" },
                                react_1.default.createElement("path", { d: "M13 10V3L4 14h7v7l9-11h-7z" })))),
                    react_1.default.createElement("div", { className: "flex-1 space-y-2" },
                        react_1.default.createElement("div", { className: "flex items-start justify-between gap-2" },
                            react_1.default.createElement(AlertTitle, { className: "text-[var(--tp-background-dark)] font-quicksand text-base" }, "Nueva versi\u00F3n disponible"),
                            react_1.default.createElement("button", { onClick: handleDismiss, className: "text-[var(--tp-lines)] hover:text-[var(--tp-background-dark)] transition-colors p-1 rounded-md hover:bg-[var(--tp-bg-light-50)]", "aria-label": "Cerrar notificaci\u00F3n" },
                                react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                                    react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })))),
                        react_1.default.createElement(AlertDescription, { className: "text-[var(--tp-lines)]" },
                            react_1.default.createElement("p", { className: "mb-4" },
                                "Hay una actualizaci\u00F3n disponible. La p\u00E1gina se actualizar\u00E1 autom\u00E1ticamente en",
                                ' ',
                                react_1.default.createElement("span", { className: "font-semibold text-[var(--tp-brand)] inline-flex items-center justify-center min-w-[24px]" }, countdown),
                                ' ',
                                "segundo",
                                countdown !== 1 ? 's' : '',
                                "."),
                            react_1.default.createElement("div", { className: "flex gap-2" },
                                react_1.default.createElement(Button, { onClick: handleUpdateNow, variant: "default", className: "flex-1" },
                                    react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                                        react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })),
                                    "Actualizar ahora"),
                                react_1.default.createElement(Button, { onClick: handlePostpone, variant: "outline", className: "flex-1" },
                                    react_1.default.createElement("svg", { className: "w-4 h-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                                        react_1.default.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })),
                                    "Posponer")))))))));
}
