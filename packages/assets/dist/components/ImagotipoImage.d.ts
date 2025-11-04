import React from 'react';
interface ImagotipoImageProps {
    width?: number;
    height?: number;
    className?: string;
    alt?: string;
    priority?: boolean;
}
/**
 * Componente Imagotipo Image de TuPatrimonio
 *
 * Usa Next.js Image component con import directo desde el package.
 * Una única fuente de verdad en packages/assets/public/
 * Optimización automática, lazy loading y responsive.
 *
 * @param width - Ancho de la imagen (default: 120)
 * @param height - Alto de la imagen (default: 150)
 * @param className - Clases CSS adicionales
 * @param alt - Texto alternativo (default: "TuPatrimonio")
 * @param priority - Si true, carga la imagen con prioridad (hero images)
 */
export declare const ImagotipoImage: React.FC<ImagotipoImageProps>;
export {};
//# sourceMappingURL=ImagotipoImage.d.ts.map