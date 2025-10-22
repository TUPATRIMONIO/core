export interface CountrySelectorProps {
    showLabel?: boolean;
    variant?: 'button' | 'minimal' | 'header';
    className?: string;
    onCountryChange?: (country: string) => void;
}
/**
 * Componente selector de país reutilizable
 */
export declare function CountrySelector({ showLabel, variant, className, onCountryChange }: CountrySelectorProps): import("react/jsx-runtime").JSX.Element;
export default CountrySelector;
