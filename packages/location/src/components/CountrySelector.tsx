'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from '../hooks/useLocation';
import { getSupportedCountries } from '../CountryConfig';
import { ChevronDown, Globe, MapPin, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';

// Props del componente principal
export interface CountrySelectorProps {
  showLabel?: boolean;
  variant?: 'button' | 'minimal' | 'header';
  className?: string;
  onCountryChange?: (country: string) => void;
}

/**
 * Componente selector de país reutilizable
 */
export function CountrySelector({ 
  showLabel = true, 
  variant = 'button',
  className = '',
  onCountryChange
}: CountrySelectorProps) {
  const { 
    country, 
    countryInfo, 
    source, 
    isLoading, 
    isManualSelection,
    setCountry, 
    resetToAutoDetection 
  } = useLocation();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [pendingCountryChange, setPendingCountryChange] = useState<string | null>(null);
  const countries = getSupportedCountries();

  const handleCountrySelect = (countryCode: string) => {
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
    return (
      <button 
        disabled 
        className={`inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-400 ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Detectando...
      </button>
    );
  }

  // Variant minimal para header
  if (variant === 'minimal') {
    return (
      <div className="relative inline-block">
        <button 
          className={`flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1 transition-colors ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-lg">{countryInfo?.flag}</span>
          <span className="text-sm font-medium">{countryInfo?.code.toUpperCase()}</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {isOpen && (
          <CountrySelectorDropdown
            countries={countries}
            currentCountry={country}
            source={source}
            onCountrySelect={handleCountrySelect}
            onResetToAuto={handleResetToAuto}
            isManualSelection={isManualSelection}
            onClose={() => setIsOpen(false)}
            variant={variant}
          />
        )}

        {/* Modal de confirmación de navegación */}
        {showNavigationDialog && (
          <NavigationConfirmDialog
            pendingCountry={countries.find(c => c.code === pendingCountryChange)}
            onConfirm={handleConfirmNavigation}
            onCancel={handleCancelNavigation}
          />
        )}
      </div>
    );
  }

  // Variant button (default)
  return (
    <div className="relative inline-block">
      <button 
        className={`inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-2">{countryInfo?.flag}</span>
        {showLabel && (
          <span className="mr-2">{countryInfo?.name}</span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <CountrySelectorDropdown
          countries={countries}
          currentCountry={country}
          source={source}
          onCountrySelect={handleCountrySelect}
          onResetToAuto={handleResetToAuto}
          isManualSelection={isManualSelection}
          onClose={() => setIsOpen(false)}
          variant={variant}
        />
      )}

      {/* Modal de confirmación de navegación */}
      {showNavigationDialog && (
        <NavigationConfirmDialog
          pendingCountry={countries.find(c => c.code === pendingCountryChange)}
          onConfirm={handleConfirmNavigation}
          onCancel={handleCancelNavigation}
        />
      )}
    </div>
  );
}

interface CountrySelectorDropdownProps {
  countries: any[];
  currentCountry: string;
  source: string;
  onCountrySelect: (country: string) => void;
  onResetToAuto: () => void;
  isManualSelection: boolean;
  onClose: () => void;
  variant?: 'button' | 'minimal' | 'header';
}

function CountrySelectorDropdown({ 
  countries, 
  currentCountry, 
  source, 
  onCountrySelect, 
  onResetToAuto, 
  isManualSelection,
  onClose,
  variant = 'button'
}: CountrySelectorDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [styles, setStyles] = useState<React.CSSProperties>({
    position: 'fixed',
    opacity: 0, // Ocultar hasta que se calcule la posición
    maxHeight: 'calc(100vh - 80px)', // Valor inicial
    overflowY: 'auto'
  });
  
  const [position, setPosition] = useState<{
    horizontal: 'left' | 'right';
    vertical: 'top' | 'bottom';
  }>({ 
    horizontal: variant === 'minimal' ? 'left' : 'right', 
    vertical: 'bottom' 
  });

  useEffect(() => {
    if (!dropdownRef.current) return;
    
    const dropdown = dropdownRef.current;
    const parent = dropdown.parentElement;
    if (!parent) return;

    const calculatePosition = () => {
      const triggerRect = parent.getBoundingClientRect();
      const dropdownWidth = 288; // w-72 = 288px
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 20;
      const spacing = 8; // Espacio entre trigger y dropdown
      
      let leftPosition: number;
      let topPosition: number;
      
      if (variant === 'minimal') {
        // Para headers, siempre extender hacia la izquierda desde el borde derecho del trigger
        leftPosition = triggerRect.right - dropdownWidth;
        setPosition(prev => ({ ...prev, horizontal: 'left' }));
      } else {
        // Para otros variants, calcular según espacio disponible
        const spaceOnRight = viewportWidth - triggerRect.right;
        const spaceOnLeft = triggerRect.left;
        const wouldOverflowRight = spaceOnRight < (dropdownWidth + margin);
        const hasSpaceOnLeft = spaceOnLeft >= (dropdownWidth + margin);
        
        if (wouldOverflowRight && hasSpaceOnLeft) {
          // Abrir hacia la izquierda
          leftPosition = triggerRect.right - dropdownWidth;
          setPosition(prev => ({ ...prev, horizontal: 'left' }));
        } else {
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
      } else {
        setPosition(prev => ({ ...prev, vertical: 'bottom' }));
      }
      
      // Clamp vertical al viewport
      topPosition = Math.max(margin, Math.min(topPosition, viewportHeight - margin));
      
      // Calcular maxHeight dinámico basado en posición vertical
      const currentVerticalPosition = position.vertical === 'top' ? 'top' : 'bottom';
      const availableHeight = currentVerticalPosition === 'top' 
        ? topPosition - margin
        : viewportHeight - topPosition - margin;
      
      const maxHeight = Math.max(200, Math.min(availableHeight, 600)); // Min 200px, Max 600px
      
      setStyles({
        position: 'fixed',
        top: topPosition,
        left: leftPosition,
        width: dropdownWidth,
        maxHeight: `${maxHeight}px`,
        overflowY: 'auto',
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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={onClose}
      />
      
      {/* Dropdown content */}
      <div 
        ref={dropdownRef} 
        className="bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
        style={styles}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Selecciona tu País</h3>
          </div>
          
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>
                {source === 'manual' ? (
                  <span className="text-[var(--tp-buttons)]">País seleccionado manualmente</span>
                ) : source === 'netlify' ? (
                  <span className="text-[var(--tp-success)]">País detectado por IP</span>
                ) : source === 'browser' ? (
                  <span className="text-[var(--tp-success)]">País detectado por navegador</span>
                ) : (
                  <span className="text-gray-600">País por defecto</span>
                )}
              </span>
            </div>
          </div>

          {/* Lista de países */}
          <div className="space-y-2 mb-4">
            {countries.map((countryOption) => {
              const isAvailable = countryOption.available;
              const isCurrentCountry = countryOption.code === currentCountry;
              
              return (
                <button
                  key={countryOption.code}
                  onClick={() => onCountrySelect(countryOption.code)}
                  disabled={!isAvailable && !isCurrentCountry}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isCurrentCountry
                      ? 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-5)]'
                      : isAvailable
                      ? 'border-gray-200 hover:border-[var(--tp-buttons-20)] hover:shadow-sm cursor-pointer'
                      : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  }`}
                  title={!isAvailable ? `Próximamente disponible${countryOption.launchDate ? ` (${countryOption.launchDate})` : ''}` : ''}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{countryOption.flag}</span>
                    <div className="text-left">
                      <div className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                        {countryOption.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isAvailable ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Disponible
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                            Próximamente {countryOption.launchDate && `(${countryOption.launchDate})`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentCountry && (
                    <div className="flex items-center gap-1 text-[var(--tp-buttons)]">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {isManualSelection ? 'Seleccionado' : 'Detectado'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Opción para resetear a detección automática */}
          {isManualSelection && (
            <div className="pt-4 border-t">
              <button
                onClick={onResetToAuto}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Usar detección automática
              </button>
            </div>
          )}

          <div className="text-xs text-gray-400 text-center pt-3 mt-3 border-t">
            La detección automática usa tu dirección IP y configuración del navegador
          </div>
        </div>
      </div>
    </>
  );
}

interface NavigationConfirmDialogProps {
  pendingCountry: any;
  onConfirm: () => void;
  onCancel: () => void;
}

function NavigationConfirmDialog({ pendingCountry, onConfirm, onCancel }: NavigationConfirmDialogProps) {
  if (!pendingCountry) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" />
      
      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg shadow-xl border max-w-md w-full mx-4 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[var(--tp-buttons-10)] rounded-full flex items-center justify-center">
              <span className="text-2xl">{pendingCountry.flag}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Cambiar a {pendingCountry.name}
              </h3>
              <p className="text-sm text-gray-600">
                ¿Quieres ver esta página en la versión de {pendingCountry.name}?
              </p>
            </div>
          </div>
          
          <div className="bg-[var(--tp-buttons-5)] border border-[var(--tp-buttons-20)] rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <div className="text-[var(--tp-buttons)] mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-[var(--tp-buttons-hover)]">Cambiarás a la versión de {pendingCountry.name}</p>
                <p className="text-[var(--tp-buttons)]">
                  Verás la misma página pero con información, precios en {pendingCountry.currency} y regulaciones específicas de {pendingCountry.name}.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              No cambiar de país
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white rounded-lg transition-colors"
            >
              Ir a versión de {pendingCountry.name}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            Si te quedas aquí, el selector mantendrá tu país actual
          </p>
        </div>
      </div>
    </>
  );
}

export default CountrySelector;