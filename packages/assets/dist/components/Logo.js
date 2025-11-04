import { jsx as _jsx } from "react/jsx-runtime";
import { Imagotipo } from './Imagotipo';
import { Isotipo } from './Isotipo';
/**
 * Componente Logo de TuPatrimonio
 *
 * Wrapper que permite elegir entre diferentes variantes del logo.
 *
 * @param variant - Variante del logo: 'imagotipo' (completo) o 'isotipo' (solo símbolo)
 * @param width - Ancho del SVG
 * @param height - Alto del SVG
 * @param className - Clases CSS adicionales
 * @param color - Color del logo (default: #800039 - Brand color)
 */
export const Logo = ({ variant = 'imagotipo', width, height, className = '', color = '#800039' }) => {
    if (variant === 'isotipo') {
        return (_jsx(Isotipo, { width: width || 100, height: height || 100, className: className, color: color }));
    }
    return (_jsx(Imagotipo, { width: width || 120, height: height || 150, className: className, color: color }));
};
