"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionNotification = VersionNotification;
exports.useVersionNotification = useVersionNotification;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Iconos SVG simples para evitar dependencias externas
 */
const RotateCcwIcon = ({ className = "h-4 w-4" }) => ((0, jsx_runtime_1.jsxs)("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), (0, jsx_runtime_1.jsx)("path", { d: "M21 3v5h-5" }), (0, jsx_runtime_1.jsx)("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), (0, jsx_runtime_1.jsx)("path", { d: "M3 21v-5h5" })] }));
const XIcon = ({ className = "h-4 w-4" }) => ((0, jsx_runtime_1.jsxs)("svg", { className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [(0, jsx_runtime_1.jsx)("path", { d: "M18 6 6 18" }), (0, jsx_runtime_1.jsx)("path", { d: "M6 6l12 12" })] }));
/**
 * Componente de notificación que aparece cuando hay una nueva versión disponible
 * Utiliza el design system de TuPatrimonio con variables CSS personalizadas
 */
function VersionNotification({ versionCheck, className = '' }) {
    const { hasUpdate, newVersion, isChecking, dismissUpdate, applyUpdate } = versionCheck;
    // No mostrar si no hay actualización o si está verificando
    if (!hasUpdate || !newVersion) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: `
        fixed top-0 left-0 right-0 z-50 
        bg-[var(--tp-brand)] text-white
        shadow-[var(--tp-shadow-lg)]
        transition-all duration-300 ease-in-out
        ${className}
      `, role: "banner", "aria-live": "polite", "aria-label": "Nueva versi\u00F3n disponible", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 py-3", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3 flex-1 min-w-0", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex-shrink-0", children: (0, jsx_runtime_1.jsx)(RotateCcwIcon, { className: `
                  h-5 w-5 text-white/90
                  ${isChecking ? 'animate-spin' : ''}
                ` }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1 min-w-0", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-white leading-tight", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Nueva versi\u00F3n disponible" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: " - Recarga para obtener las \u00FAltimas mejoras y correcciones" })] }), newVersion.version && ((0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-white/80 mt-1 hidden sm:block", children: ["Versi\u00F3n ", newVersion.version, " - ", new Date(newVersion.timestamp).toLocaleString('es-CL')] }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 flex-shrink-0", children: [(0, jsx_runtime_1.jsx)("button", { onClick: applyUpdate, disabled: isChecking, className: `
                inline-flex items-center justify-center
                px-3 py-1.5 text-xs font-semibold
                bg-white/10 hover:bg-white/20 
                border border-white/20 hover:border-white/30
                rounded-[var(--tp-radius-md)]
                text-white transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/50
                disabled:opacity-60 disabled:cursor-not-allowed
                min-w-[80px]
              `, "aria-label": "Recargar aplicaci\u00F3n", children: isChecking ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(RotateCcwIcon, { className: "h-3 w-3 mr-1 animate-spin" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Verificando..." }), (0, jsx_runtime_1.jsx)("span", { className: "sm:hidden", children: "..." })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(RotateCcwIcon, { className: "h-3 w-3 mr-1" }), (0, jsx_runtime_1.jsx)("span", { className: "hidden sm:inline", children: "Recargar" }), (0, jsx_runtime_1.jsx)("span", { className: "sm:hidden", children: "OK" })] })) }), (0, jsx_runtime_1.jsx)("button", { onClick: dismissUpdate, disabled: isChecking, className: `
                inline-flex items-center justify-center
                p-1.5 rounded-[var(--tp-radius-sm)]
                text-white/70 hover:text-white
                bg-white/0 hover:bg-white/10
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-white/50
                disabled:opacity-60 disabled:cursor-not-allowed
              `, "aria-label": "Cerrar notificaci\u00F3n", children: (0, jsx_runtime_1.jsx)(XIcon, { className: "h-4 w-4" }) })] })] }) }) }));
}
function useVersionNotification(options = {}) {
    // Este hook se implementará si es necesario, por ahora devolvemos las props necesarias
    return {
        ...options
    };
}
exports.default = VersionNotification;
