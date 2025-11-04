import React from 'react';
import { Imagotipo } from './Imagotipo';
import { Isotipo } from './Isotipo';

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
export const Logo: React.FC<LogoProps> = ({ 
  variant = 'imagotipo',
  width,
  height,
  className = '',
  color = '#800039'
}) => {
  if (variant === 'isotipo') {
    return (
      <Isotipo 
        width={width || 100} 
        height={height || 100} 
        className={className} 
        color={color}
      />
    );
  }

  return (
    <Imagotipo 
      width={width || 120} 
      height={height || 150} 
      className={className} 
      color={color}
    />
  );
};

