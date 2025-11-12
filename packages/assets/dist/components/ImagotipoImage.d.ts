import React from 'react';
type LogoVariant = 'imagotipo' | 'horizontal' | 'isotipo';
interface ImagotipoImageProps {
    width?: number;
    height?: number;
    className?: string;
    alt?: string;
    priority?: boolean;
    variant?: LogoVariant;
}
/**
 * Componente Imagotipo Image de TuPatrimonio
 *
 * Usa Next.js Image component con import directo desde el package.
 * Una única fuente de verdad en packages/assets/public/
 * Optimización automática, lazy loading y responsive.
 *
 * @param width - Ancho de la imagen
 * @param height - Alto de la imagen
 * @param className - Clases CSS adicionales
 * @param alt - Texto alternativo (default: "TuPatrimonio")
 * @param priority - Si true, carga la imagen con prioridad (hero images)
 * @param variant - Variante del logo: 'imagotipo' | 'horizontal' | 'isotipo' (default: 'imagotipo')
 */
export declare const ImagotipoImage: React.FC<ImagotipoImageProps>;
export {};
//# sourceMappingURL=ImagotipoImage.d.ts.map