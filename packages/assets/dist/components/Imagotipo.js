import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Componente Imagotipo de TuPatrimonio
 *
 * Muestra el logo completo con los círculos característicos y el texto.
 *
 * @param width - Ancho del SVG (default: 120)
 * @param height - Alto del SVG (default: 150)
 * @param className - Clases CSS adicionales
 * @param color - Color del logo (default: #800039 - Brand color)
 */
export const Imagotipo = ({ width = 120, height = 150, className = '', color = '#800039' }) => {
    return (_jsxs("svg", { width: width, height: height, viewBox: "0 0 250 400", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, "aria-label": "TuPatrimonio Logo", children: [_jsx("circle", { cx: "125", cy: "50", r: "20", fill: color }), _jsx("circle", { cx: "85", cy: "85", r: "20", fill: color }), _jsx("circle", { cx: "165", cy: "85", r: "20", fill: color }), _jsx("circle", { cx: "45", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "205", cy: "120", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "155", r: "20", fill: color }), _jsx("circle", { cx: "85", cy: "190", r: "20", fill: color }), _jsx("circle", { cx: "165", cy: "190", r: "20", fill: color }), _jsx("circle", { cx: "125", cy: "225", r: "20", fill: color }), _jsx("text", { x: "125", y: "300", fontFamily: "'Brush Script MT', cursive", fontSize: "48", fill: color, textAnchor: "middle", children: "TuPatrimonio" })] }));
};
