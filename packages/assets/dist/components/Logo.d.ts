import React from 'react';
interface LogoProps {
    variant?: 'imagotipo' | 'isotipo';
    width?: number;
    height?: number;
    className?: string;
    color?: string;
}
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
export declare const Logo: React.FC<LogoProps>;
export {};
//# sourceMappingURL=Logo.d.ts.map