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
 * Diseño moderno y empático siguiendo las guidelines de TuPatrimonio
 * Funciona perfectamente en light y dark mode
 */
const react_1 = __importStar(require("react"));
const useUpdateDetection_1 = require("../hooks/useUpdateDetection");
const ui_1 = require("@tupatrimonio/ui");
const ui_2 = require("@tupatrimonio/ui");
const ui_3 = require("@tupatrimonio/ui");
const lucide_react_1 = require("lucide-react");
function UpdateNotification() {
    const { hasUpdate, dismissUpdate, applyUpdate } = (0, useUpdateDetection_1.useUpdateDetection)();
    const [isVisible, setIsVisible] = (0, react_1.useState)(false);
    // Mostrar notificación cuando hay actualización
    (0, react_1.useEffect)(() => {
        if (hasUpdate) {
            setIsVisible(true);
        }
    }, [hasUpdate]);
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

          @keyframes tp-pulse-glow {
            0%, 100% {
              transform: scale(1);
              opacity: 0.8;
            }
            50% {
              transform: scale(1.05);
              opacity: 1;
            }
          }

          .tp-animate-slide-in {
            animation: tp-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .tp-pulse-glow {
            animation: tp-pulse-glow 2s ease-in-out infinite;
          }
        `
            } }),
        react_1.default.createElement("div", { className: "fixed top-4 right-4 w-full max-w-md tp-animate-slide-in px-4", style: { zIndex: 9999 } },
            react_1.default.createElement(ui_1.Card, { className: "border-2 border-[var(--tp-brand)] shadow-2xl bg-card relative overflow-hidden" },
                react_1.default.createElement("button", { onClick: handleDismiss, className: "absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50 z-10", "aria-label": "Cerrar notificaci\u00F3n" },
                    react_1.default.createElement(ui_3.Icon, { icon: lucide_react_1.X, size: "sm", variant: "inherit" })),
                react_1.default.createElement(ui_1.CardHeader, { className: "pb-4 pt-6 pr-12" },
                    react_1.default.createElement("div", { className: "flex items-start gap-4" },
                        react_1.default.createElement("div", { className: "tp-pulse-glow" },
                            react_1.default.createElement(ui_3.IconContainer, { icon: lucide_react_1.Sparkles, variant: "solid-brand", shape: "rounded", size: "md" })),
                        react_1.default.createElement("div", { className: "flex-1" },
                            react_1.default.createElement(ui_1.CardTitle, { className: "text-lg mb-1" }, "\u00A1Hay algo nuevo para ti!"),
                            react_1.default.createElement(ui_1.CardDescription, { className: "text-sm" }, "Acabamos de mejorar la plataforma")))),
                react_1.default.createElement(ui_1.CardContent, { className: "pb-6 space-y-4" },
                    react_1.default.createElement("p", { className: "text-sm text-muted-foreground leading-relaxed" }, "Tenemos una versi\u00F3n mejorada lista para ti. Cuando actualices, la p\u00E1gina se recargar\u00E1 por completo."),
                    react_1.default.createElement("div", { className: "flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg" },
                        react_1.default.createElement(ui_3.Icon, { icon: lucide_react_1.AlertCircle, size: "sm", className: "text-blue-600 dark:text-blue-400" }),
                        react_1.default.createElement("span", { className: "text-xs text-blue-700 dark:text-blue-300 font-medium" }, "Guarda tu trabajo antes de actualizar")),
                    react_1.default.createElement("div", { className: "flex flex-col sm:flex-row gap-2 pt-2" },
                        react_1.default.createElement(ui_2.Button, { onClick: handleUpdateNow, size: "default", className: "flex-1 bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-white shadow-lg hover:shadow-xl transition-all" },
                            react_1.default.createElement(ui_3.Icon, { icon: lucide_react_1.RefreshCw, size: "sm", variant: "white" }),
                            "Actualizar Ahora"),
                        react_1.default.createElement(ui_2.Button, { onClick: handlePostpone, variant: "outline", size: "default", className: "flex-1 border-2 hover:bg-muted/50 transition-all" }, "M\u00E1s Tarde")),
                    react_1.default.createElement("p", { className: "text-xs text-muted-foreground/70 text-center pt-1" }, "Solo tomar\u00E1 un momento y vale la pena"))))));
}
