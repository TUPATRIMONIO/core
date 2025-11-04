import React from 'react';

interface ImagotipoProps {
  width?: number;
  height?: number;
  className?: string;
  color?: string;
}

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
export const Imagotipo: React.FC<ImagotipoProps> = ({ 
  width = 120, 
  height = 150,
  className = '',
  color = '#800039'
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 250 400" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="TuPatrimonio Logo"
    >
      {/* Círculos superiores */}
      <circle cx="125" cy="50" r="20" fill={color}/>
      <circle cx="85" cy="85" r="20" fill={color}/>
      <circle cx="165" cy="85" r="20" fill={color}/>
      
      {/* Círculos medios */}
      <circle cx="45" cy="120" r="20" fill={color}/>
      <circle cx="125" cy="120" r="20" fill={color}/>
      <circle cx="205" cy="120" r="20" fill={color}/>
      
      {/* Círculos inferiores */}
      <circle cx="125" cy="155" r="20" fill={color}/>
      <circle cx="85" cy="190" r="20" fill={color}/>
      <circle cx="165" cy="190" r="20" fill={color}/>
      
      {/* Círculo final */}
      <circle cx="125" cy="225" r="20" fill={color}/>
      
      {/* Texto TuPatrimonio */}
      <text 
        x="125" 
        y="300" 
        fontFamily="'Brush Script MT', cursive" 
        fontSize="48" 
        fill={color} 
        textAnchor="middle"
      >
        TuPatrimonio
      </text>
    </svg>
  );
};

