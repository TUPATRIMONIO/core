'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useLocation } from '../hooks/useLocation';
import { getSupportedCountries } from '../CountryConfig';
import { ChevronDown, Globe, MapPin, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
/**
 * Componente selector de país reutilizable
 */
export function CountrySelector({ showLabel = true, variant = 'button', className = '', onCountryChange }) {
    const { country, countryInfo, source, isLoading, isManualSelection, setCountry, resetToAutoDetection } = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [showNavigationDialog, setShowNavigationDialog] = useState(false);
    const [pendingCountryChange, setPendingCountryChange] = useState(null);
    const countries = getSupportedCountries();
    const handleCountrySelect = (countryCode) => {
        // Detectar si estamos en una página específica de país
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const countryPageMatch = currentPath.match(/^\/([a-z]{2})\/(.+)$/);
            if (countryPageMatch) {
                const [, currentCountry, pagePath] = countryPageMatch;
                // Si el país seleccionado es diferente al actual, mostrar confirmación
                if (countryCode !== currentCountry) {
                    setPendingCountryChange(countryCode);
                    setShowNavigationDialog(true);
                    setIsOpen(false);
                    return;
                }
            }
        }
        // Cambio normal sin navegación
        setCountry(countryCode);
        setIsOpen(false);
        onCountryChange?.(countryCode);
    };
    const handleConfirmNavigation = () => {
        if (pendingCountryChange && typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const countryPageMatch = currentPath.match(/^\/([a-z]{2})\/(.+)$/);
            if (countryPageMatch) {
                const [, , pagePath] = countryPageMatch;
                const newPath = `/${pendingCountryChange}/${pagePath}`;
                // Cambiar país y navegar
                setCountry(pendingCountryChange);
                window.location.href = newPath;
            }
        }
        setShowNavigationDialog(false);
        setPendingCountryChange(null);
    };
    const handleCancelNavigation = () => {
        // No cambiar nada, mantener el país actual
        setShowNavigationDialog(false);
        setPendingCountryChange(null);
        // El selector se mantiene en el país original
    };
    const handleResetToAuto = () => {
        resetToAutoDetection();
        setIsOpen(false);
    };
    if (isLoading) {
        return (_jsxs("button", { disabled: true, className: `inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-400 ${className}`, children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }), "Detectando..."] }));
    }
    // Variant minimal para header
    if (variant === 'minimal') {
        return (_jsxs("div", { className: "relative inline-block", children: [_jsxs("button", { className: `flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors ${className}`, onClick: () => setIsOpen(!isOpen), children: [_jsx("span", { className: "text-lg", children: countryInfo?.flag }), _jsx("span", { className: "text-sm font-medium", children: countryInfo?.code.toUpperCase() }), _jsx(ChevronDown, { className: "w-3 h-3" })] }), isOpen && (_jsx(CountrySelectorDropdown, { countries: countries, currentCountry: country, source: source, onCountrySelect: handleCountrySelect, onResetToAuto: handleResetToAuto, isManualSelection: isManualSelection, onClose: () => setIsOpen(false), variant: variant })), showNavigationDialog && (_jsx(NavigationConfirmDialog, { pendingCountry: countries.find(c => c.code === pendingCountryChange), onConfirm: handleConfirmNavigation, onCancel: handleCancelNavigation }))] }));
    }
    // Variant button (default)
    return (_jsxs("div", { className: "relative inline-block", children: [_jsxs("button", { className: `inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`, onClick: () => setIsOpen(!isOpen), children: [_jsx("span", { className: "mr-2", children: countryInfo?.flag }), showLabel && (_jsx("span", { className: "mr-2", children: countryInfo?.name })), _jsx(ChevronDown, { className: "w-4 h-4" })] }), isOpen && (_jsx(CountrySelectorDropdown, { countries: countries, currentCountry: country, source: source, onCountrySelect: handleCountrySelect, onResetToAuto: handleResetToAuto, isManualSelection: isManualSelection, onClose: () => setIsOpen(false), variant: variant })), showNavigationDialog && (_jsx(NavigationConfirmDialog, { pendingCountry: countries.find(c => c.code === pendingCountryChange), onConfirm: handleConfirmNavigation, onCancel: handleCancelNavigation }))] }));
}
function CountrySelectorDropdown({ countries, currentCountry, source, onCountrySelect, onResetToAuto, isManualSelection, onClose, variant = 'button' }) {
    const dropdownRef = useRef(null);
    const [styles, setStyles] = useState({
        position: 'fixed',
        opacity: 0, // Ocultar hasta que se calcule la posición
    });
    const [position, setPosition] = useState({
        horizontal: variant === 'minimal' ? 'left' : 'right',
        vertical: 'bottom'
    });
    useEffect(() => {
        if (!dropdownRef.current)
            return;
        const dropdown = dropdownRef.current;
        const parent = dropdown.parentElement;
        if (!parent)
            return;
        const calculatePosition = () => {
            const triggerRect = parent.getBoundingClientRect();
            const dropdownWidth = 288; // w-72 = 288px
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const margin = 20;
            const spacing = 8; // Espacio entre trigger y dropdown
            let leftPosition;
            let topPosition;
            if (variant === 'minimal') {
                // Para headers, siempre extender hacia la izquierda desde el borde derecho del trigger
                leftPosition = triggerRect.right - dropdownWidth;
                setPosition(prev => ({ ...prev, horizontal: 'left' }));
            }
            else {
                // Para otros variants, calcular según espacio disponible
                const spaceOnRight = viewportWidth - triggerRect.right;
                const spaceOnLeft = triggerRect.left;
                const wouldOverflowRight = spaceOnRight < (dropdownWidth + margin);
                const hasSpaceOnLeft = spaceOnLeft >= (dropdownWidth + margin);
                if (wouldOverflowRight && hasSpaceOnLeft) {
                    // Abrir hacia la izquierda
                    leftPosition = triggerRect.right - dropdownWidth;
                    setPosition(prev => ({ ...prev, horizontal: 'left' }));
                }
                else {
                    // Abrir hacia la derecha (default)
                    leftPosition = triggerRect.left;
                    setPosition(prev => ({ ...prev, horizontal: 'right' }));
                }
            }
            // Clamp horizontal al viewport con margen
            leftPosition = Math.max(margin, Math.min(leftPosition, viewportWidth - dropdownWidth - margin));
            // Calcular posición vertical (por defecto abajo)
            topPosition = triggerRect.bottom + spacing;
            // Verificar si se sale por abajo
            const dropdownHeight = dropdown.offsetHeight || 350; // Estimado
            if (topPosition + dropdownHeight > viewportHeight - margin) {
                // Abrir hacia arriba
                topPosition = triggerRect.top - dropdownHeight - spacing;
                setPosition(prev => ({ ...prev, vertical: 'top' }));
            }
            else {
                setPosition(prev => ({ ...prev, vertical: 'bottom' }));
            }
            // Clamp vertical al viewport
            topPosition = Math.max(margin, Math.min(topPosition, viewportHeight - margin));
            setStyles({
                position: 'fixed',
                top: topPosition,
                left: leftPosition,
                width: dropdownWidth,
                opacity: 1, // Mostrar después de calcular
            });
        };
        // Calcular posición inicial
        requestAnimationFrame(calculatePosition);
        // Recalcular en resize y scroll
        window.addEventListener('resize', calculatePosition);
        window.addEventListener('scroll', calculatePosition, true);
        return () => {
            window.removeEventListener('resize', calculatePosition);
            window.removeEventListener('scroll', calculatePosition, true);
        };
    }, [variant]);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-[9998]", onClick: onClose }), _jsx("div", { ref: dropdownRef, className: "bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-[calc(100vh-80px)] overflow-y-auto", style: styles, children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(Globe, { className: "w-5 h-5 text-gray-600" }), _jsx("h3", { className: "text-lg font-semibold", children: "Selecciona tu Pa\u00EDs" })] }), _jsx("div", { className: "bg-gray-50 rounded-lg p-3 mb-4", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(MapPin, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { children: source === 'manual' ? (_jsx("span", { className: "text-[var(--tp-buttons)]", children: "Pa\u00EDs seleccionado manualmente" })) : source === 'netlify' ? (_jsx("span", { className: "text-[var(--tp-success)]", children: "Pa\u00EDs detectado por IP" })) : source === 'browser' ? (_jsx("span", { className: "text-[var(--tp-success)]", children: "Pa\u00EDs detectado por navegador" })) : (_jsx("span", { className: "text-gray-600", children: "Pa\u00EDs por defecto" })) })] }) }), _jsx("div", { className: "space-y-2 mb-4", children: countries.map((countryOption) => {
                                const isAvailable = countryOption.available;
                                const isCurrentCountry = countryOption.code === currentCountry;
                                return (_jsxs("button", { onClick: () => onCountrySelect(countryOption.code), disabled: !isAvailable && !isCurrentCountry, className: `w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isCurrentCountry
                                        ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-5)]'
                                        : isAvailable
                                            ? 'border-gray-200 hover:border-[var(--tp-buttons-20)] hover:shadow-sm cursor-pointer'
                                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'}`, title: !isAvailable ? `Próximamente disponible${countryOption.launchDate ? ` (${countryOption.launchDate})` : ''}` : '', children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: countryOption.flag }), _jsxs("div", { className: "text-left", children: [_jsx("div", { className: `font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`, children: countryOption.name }), _jsx("div", { className: "flex items-center gap-2 mt-1", children: isAvailable ? (_jsx("span", { className: "text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium", children: "Disponible" })) : (_jsxs("span", { className: "text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium", children: ["Pr\u00F3ximamente ", countryOption.launchDate && `(${countryOption.launchDate})`] })) })] })] }), isCurrentCountry && (_jsxs("div", { className: "flex items-center gap-1 text-[var(--tp-buttons)]", children: [_jsx(CheckCircle, { className: "w-4 h-4" }), _jsx("span", { className: "text-xs font-medium", children: isManualSelection ? 'Seleccionado' : 'Detectado' })] }))] }, countryOption.code));
                            }) }), isManualSelection && (_jsx("div", { className: "pt-4 border-t", children: _jsxs("button", { onClick: onResetToAuto, className: "w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), "Usar detecci\u00F3n autom\u00E1tica"] }) })), _jsx("div", { className: "text-xs text-gray-400 text-center pt-3 mt-3 border-t", children: "La detecci\u00F3n autom\u00E1tica usa tu direcci\u00F3n IP y configuraci\u00F3n del navegador" })] }) })] }));
}
function NavigationConfirmDialog({ pendingCountry, onConfirm, onCancel }) {
    if (!pendingCountry)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 bg-black/50 z-[9998]" }), _jsx("div", { className: "fixed inset-0 flex items-center justify-center z-[9999]", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl border max-w-md w-full mx-4 p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-12 h-12 bg-[var(--tp-buttons-10)] rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-2xl", children: pendingCountry.flag }) }), _jsxs("div", { children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Cambiar a ", pendingCountry.name] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["\u00BFQuieres ver esta p\u00E1gina en la versi\u00F3n de ", pendingCountry.name, "?"] })] })] }), _jsx("div", { className: "bg-[var(--tp-buttons-5)] border border-[var(--tp-buttons-20)] rounded-lg p-3 mb-4", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "text-[var(--tp-buttons)] mt-0.5", children: _jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z", clipRule: "evenodd" }) }) }), _jsxs("div", { className: "text-sm", children: [_jsxs("p", { className: "font-medium text-[var(--tp-buttons-hover)]", children: ["Cambiar\u00E1s a la versi\u00F3n de ", pendingCountry.name] }), _jsxs("p", { className: "text-[var(--tp-buttons)]", children: ["Ver\u00E1s la misma p\u00E1gina pero con informaci\u00F3n, precios en ", pendingCountry.currency, " y regulaciones espec\u00EDficas de ", pendingCountry.name, "."] })] })] }) }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: onCancel, className: "flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "No cambiar de pa\u00EDs" }), _jsxs("button", { onClick: onConfirm, className: "flex-1 px-4 py-2 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white rounded-lg transition-colors", children: ["Ir a versi\u00F3n de ", pendingCountry.name] })] }), _jsx("p", { className: "text-xs text-gray-500 text-center mt-3", children: "Si te quedas aqu\u00ED, el selector mantendr\u00E1 tu pa\u00EDs actual" })] }) })] }));
}
export default CountrySelector;
