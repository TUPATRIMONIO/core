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
/**
 * Componente de ícono minimalista
 *
 * @example
 * ```tsx
 * <Icon icon={Shield} size="md" variant="brand" />
 * <Icon icon={Zap} size="lg" variant="muted" style="minimal" />
 * ```
 */
export declare function Icon({ icon: LucideIconComponent, size, variant, style, className, }: IconProps): import("react/jsx-runtime").JSX.Element;
interface IconContainerProps {
    icon: LucideIcon;
    variant?: 'brand' | 'muted' | 'neutral' | 'solid-brand';
    shape?: 'circle' | 'square' | 'rounded';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}
/**
 * Componente de ícono dentro de un contenedor con fondo y borde
 *
 * @example
 * ```tsx
 * <IconContainer icon={Target} variant="brand" shape="rounded" size="lg" />
 * <IconContainer icon={Globe} variant="solid-brand" shape="circle" size="md" />
 * ```
 */
export declare function IconContainer({ icon: LucideIconComponent, variant, shape, size, className, }: IconContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Icon.d.ts.map