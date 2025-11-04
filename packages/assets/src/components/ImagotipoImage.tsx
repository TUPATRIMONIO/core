import React from 'react';
import Image from 'next/image';
// Import directo de la imagen desde el package - una sola fuente de verdad
// Path relativo desde dist/components/ hacia public/
import imagotipoSrc from '../../public/images/logo/Imagotipo.webp';

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
export const ImagotipoImage: React.FC<ImagotipoImageProps> = ({ 
  width = 120, 
  height = 150,
  className = '',
  alt = 'TuPatrimonio',
  priority = false
}) => {
  return (
    <Image
      src={imagotipoSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={95}
    />
  );
};

