import React from 'react';
import Image from 'next/image';
// Import directo de las imágenes desde el package - una sola fuente de verdad
// Path relativo desde dist/components/ hacia public/
import imagotipoSrc from '../../public/images/logo/Imagotipo.webp';
import logoHorizontalSrc from '../../public/images/logo/logo-horizontal.svg';
import isotipoSrc from '../../public/images/logo/isotipo.svg';

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
export const ImagotipoImage: React.FC<ImagotipoImageProps> = ({ 
  width, 
  height,
  className = '',
  alt = 'TuPatrimonio',
  priority = false,
  variant = 'imagotipo'
}) => {
  // Seleccionar el source según la variante
  const logoSrc = variant === 'horizontal' 
    ? logoHorizontalSrc 
    : variant === 'isotipo' 
    ? isotipoSrc 
    : imagotipoSrc;
  
  // Defaults específicos por variante
  const defaultWidth = variant === 'horizontal' 
    ? 180 
    : variant === 'isotipo' 
    ? 50 
    : 120;
  
  const defaultHeight = variant === 'horizontal' 
    ? 50 
    : variant === 'isotipo' 
    ? 50 
    : 150;

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={className}
      priority={priority}
      quality={95}
    />
  );
};

