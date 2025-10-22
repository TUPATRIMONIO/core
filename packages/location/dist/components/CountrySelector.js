'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { getSupportedCountries } from '../CountryConfig';
// Iconos simplificados (fallback si lucide-react no está disponible)
const ChevronDownIcon = () => _jsx("span", { style: { fontSize: '12px' }, children: "\u25BC" });
const GlobeIcon = () => _jsx("span", { style: { fontSize: '16px' }, children: "\uD83C\uDF0D" });
const MapPinIcon = () => _jsx("span", { style: { fontSize: '14px' }, children: "\uD83D\uDCCD" });
const CheckCircleIcon = () => _jsx("span", { style: { fontSize: '14px' }, children: "\u2713" });
const RotateCcwIcon = () => _jsx("span", { style: { fontSize: '14px' }, children: "\u21BB" });
const LoaderIcon = () => _jsx("span", { style: { fontSize: '14px' }, children: "\u27F3" });
// Componentes UI básicos (fallback)
const Button = ({ children, variant = 'default', size = 'md', className = '', disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50';
    const variants = {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
    };
    const sizes = {
        sm: 'h-9 px-3 text-xs',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8'
    };
    return (_jsx("button", { className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`, disabled: disabled, ...props, children: children }));
};
const Dialog = ({ open, onOpenChange, children }) => {
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm", onClick: () => onOpenChange(false), children: _jsx("div", { className: "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]", children: children }) }));
};
const DialogTrigger = ({ children }) => _jsx(_Fragment, { children: children });
const DialogContent = ({ className = '', children }) => (_jsx("div", { className: `z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg rounded-lg ${className}`, onClick: (e) => e.stopPropagation(), children: children }));
const DialogHeader = ({ children }) => (_jsx("div", { className: "flex flex-col space-y-1.5 text-center sm:text-left", children: children }));
const DialogTitle = ({ className = '', children }) => (_jsx("h3", { className: `text-lg font-semibold leading-none tracking-tight ${className}`, children: children }));
/**
 * Componente selector de país reutilizable
 */
export function CountrySelector({ showLabel = true, variant = 'button', className = '', onCountryChange }) {
    const { country, countryInfo, source, isLoading, isManualSelection, setCountry, resetToAutoDetection } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const countries = getSupportedCountries();
    const handleCountrySelect = (countryCode) => {
        setCountry(countryCode);
        setIsOpen(false);
        onCountryChange?.(countryCode);
    };
    const handleResetToAuto = () => {
        resetToAutoDetection();
        setIsOpen(false);
    };
    if (isLoading) {
        return (_jsxs(Button, { variant: "outline", size: "sm", disabled: true, className: className, children: [_jsx(LoaderIcon, {}), _jsx("span", { className: "ml-2", children: "Detectando..." })] }));
    }
    // Variant minimal para header
    if (variant === 'minimal') {
        return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { children: _jsxs("button", { className: `flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors ${className}`, onClick: () => setIsOpen(true), children: [_jsx("span", { className: "text-lg", children: countryInfo?.flag }), _jsx("span", { className: "text-sm font-medium", children: countryInfo?.code.toUpperCase() }), _jsx(ChevronDownIcon, {})] }) }), _jsx(CountrySelectorContent, { countries: countries, currentCountry: country, source: source, onCountrySelect: handleCountrySelect, onResetToAuto: handleResetToAuto, isManualSelection: isManualSelection })] }));
    }
    // Variant button (default)
    return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { children: _jsxs(Button, { variant: "outline", size: "sm", className: className, onClick: () => setIsOpen(true), children: [_jsx("span", { className: "mr-2", children: countryInfo?.flag }), showLabel && (_jsx("span", { className: "mr-2", children: countryInfo?.name })), _jsx(ChevronDownIcon, {})] }) }), _jsx(CountrySelectorContent, { countries: countries, currentCountry: country, source: source, onCountrySelect: handleCountrySelect, onResetToAuto: handleResetToAuto, isManualSelection: isManualSelection })] }));
}
function CountrySelectorContent({ countries, currentCountry, source, onCountrySelect, onResetToAuto, isManualSelection }) {
    return (_jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(GlobeIcon, {}), "Selecciona tu Pa\u00EDs"] }) }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-gray-50 rounded-lg p-3", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(MapPinIcon, {}), _jsx("span", { children: source === 'manual' ? (_jsx("span", { className: "text-blue-600", children: "Pa\u00EDs seleccionado manualmente" })) : source === 'netlify' ? (_jsx("span", { className: "text-green-600", children: "Pa\u00EDs detectado por IP" })) : source === 'browser' ? (_jsx("span", { className: "text-green-600", children: "Pa\u00EDs detectado por navegador" })) : (_jsx("span", { className: "text-gray-600", children: "Pa\u00EDs por defecto" })) })] }) }), _jsx("div", { className: "space-y-2", children: countries.map((country) => (_jsxs("button", { onClick: () => onCountrySelect(country.code), className: `w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all hover:scale-[1.02] ${country.code === currentCountry
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: country.flag }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium text-gray-900", children: country.name }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Precios en ", country.currency] })] })] }), country.code === currentCountry && (_jsxs("div", { className: "flex items-center gap-1 text-blue-500", children: [_jsx(CheckCircleIcon, {}), _jsx("span", { className: "text-xs font-medium", children: isManualSelection ? 'Seleccionado' : 'Detectado' })] }))] }, country.code))) }), isManualSelection && (_jsx("div", { className: "pt-4 border-t", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: onResetToAuto, className: "w-full", children: [_jsx(RotateCcwIcon, {}), _jsx("span", { className: "ml-2", children: "Usar detecci\u00F3n autom\u00E1tica" })] }) })), _jsx("div", { className: "text-xs text-gray-400 text-center pt-2", children: "La detecci\u00F3n autom\u00E1tica usa tu direcci\u00F3n IP y configuraci\u00F3n del navegador" })] })] }));
}
export default CountrySelector;
