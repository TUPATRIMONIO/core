import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Componente Isotipo de TuPatrimonio (Solo los círculos, sin texto)
 *
 * Muestra únicamente el símbolo de círculos característico de la marca.
 *
 * @param width - Ancho del SVG (default: 100)
 * @param height - Alto del SVG (default: 100)
 * @param className - Clases CSS adicionales
 * @param color - Color del logo (default: #800039 - Brand color)
 */
export const Isotipo = ({ width = 100, height = 100, className = '', color = '#800039' }) => {
    return (_jsxs("svg", { width: width, height: height, viewBox: "0 0 250 270", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, "aria-label": "TuPatrimonio Isotipo", children: [_jsx("circle", { cx: "125", cy: "50", r: "20", fill: color }), _jsx("circle", { cx: "85", cy: "85", r: "20", fill: color }), _jsx("circle", { cx: "165", cy: "85", r: "20", fill: color }), _jsx("circle", { cx: "45", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "205", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "155", r: "20", fill: color }), _jsx("circle", { cx: "85", cy: "190", r: "20", fill: color }), _jsx("circle", { cx: "165", cy: "190", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "225", r: "20", fill: color })] }));
};
