import React from 'react';
import { LucideIcon } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconVariant = 'default' | 'muted' | 'brand' | 'white' | 'inherit';
export type IconStyle = 'outline' | 'minimal';

interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  variant?: IconVariant;
  style?: IconStyle;
  className?: string;
}

const sizeMap: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const variantMap: Record<IconVariant, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  brand: 'text-[var(--tp-brand)]',
  white: 'text-white',
  inherit: '', // Hereda el color del padre
};

/**
 * Componente de ícono minimalista
 * 
 * @example
 * ```tsx
 * <Icon icon={Shield} size="md" variant="brand" />
 * <Icon icon={Zap} size="lg" variant="muted" style="minimal" />
 * ```
 */
export function Icon({
  icon: LucideIconComponent,
  size = 'md',
  variant = 'default',
  style = 'outline',
  className = '',
}: IconProps) {
  const classes = [
    sizeMap[size],
    variantMap[variant],
    'stroke-[1.5]', // Línea delgada y minimalista por defecto
    className
  ].filter(Boolean).join(' ');

  return (
    <LucideIconComponent
      className={classes}
      strokeWidth={style === 'minimal' ? 1 : 1.5}
    />
  );
}

// ============================================================================
// IconContainer - Ícono dentro de contenedor con fondo y borde
// ============================================================================

interface IconContainerProps {
  icon: LucideIcon;
  variant?: 'brand' | 'muted' | 'neutral' | 'solid-brand';
  shape?: 'circle' | 'square' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const containerSizeMap = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
};

const containerIconSizeMap = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
};

const containerVariantMap = {
  'brand': 'bg-[var(--tp-brand-10)] text-[var(--tp-brand)] border-[var(--tp-brand-20)]',
  'muted': 'bg-muted text-muted-foreground border-border',
  'neutral': 'bg-background text-foreground border-border',
  'solid-brand': 'bg-[var(--tp-brand)] text-white border-[var(--tp-brand)]',
};

const shapeMap = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-xl',
};

/**
 * Componente de ícono dentro de un contenedor con fondo y borde
 * 
 * @example
 * ```tsx
 * <IconContainer icon={Target} variant="brand" shape="rounded" size="lg" />
 * <IconContainer icon={Globe} variant="solid-brand" shape="circle" size="md" />
 * ```
 */
export function IconContainer({
  icon: LucideIconComponent,
  variant = 'brand',
  shape = 'rounded',
  size = 'md',
  className = '',
}: IconContainerProps) {
  const containerClasses = [
    'flex items-center justify-center border',
    containerSizeMap[size],
    containerVariantMap[variant],
    shapeMap[shape],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <LucideIconComponent
        className={containerIconSizeMap[size]}
        strokeWidth={1.5}
      />
    </div>
  );
}

