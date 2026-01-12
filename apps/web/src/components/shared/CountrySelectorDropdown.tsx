'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useGlobalCountry, useGlobalCountryOptional } from '@/providers/GlobalCountryProvider'
import { ChevronDown, Globe, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CountrySelectorDropdownProps {
  /** Variante de visualización */
  variant?: 'compact' | 'full' | 'sidebar'
  /** Clase CSS adicional */
  className?: string
  /** Si mostrar opción de reset */
  showReset?: boolean
}

/**
 * Selector global de país
 * 
 * Permite al usuario seleccionar el país para ver servicios disponibles
 * y precios en la moneda correspondiente.
 * 
 * Nota: El país seleccionado filtra los SERVICIOS disponibles, no restringe
 * desde dónde el usuario puede acceder a la plataforma.
 */
export function CountrySelectorDropdown({
  variant = 'compact',
  className,
  showReset = false,
}: CountrySelectorDropdownProps) {
  const context = useGlobalCountryOptional()

  // Si no hay provider, mostrar un fallback simple
  if (!context) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Globe className="h-4 w-4" />
        <span className="ml-1">🇨🇱</span>
      </Button>
    )
  }

  const { country, countryInfo, isLoading, source, setCountry, resetToAutoDetection, supportedCountries } = context

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Globe className="h-4 w-4 animate-pulse" />
      </Button>
    )
  }

  const flag = countryInfo?.flag || '🌍'
  const name = countryInfo?.name || country

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "gap-1.5",
            variant === 'sidebar' && "w-full justify-start",
            className
          )}
        >
          <span className="text-base">{flag}</span>
          {variant !== 'compact' && (
            <span className="text-sm font-medium">{name}</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={variant === 'sidebar' ? 'start' : 'end'} 
        className="w-56"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          Servicios disponibles en:
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {supportedCountries.map((c) => {
          const isSelected = c.code.toUpperCase() === country
          const isAvailable = c.available
          
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => isAvailable && setCountry(c.code)}
              disabled={!isAvailable}
              className={cn(
                "flex items-center justify-between gap-2",
                isSelected && "bg-accent",
                !isAvailable && "opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{c.flag}</span>
                <span>{c.name}</span>
              </div>
              {!isAvailable && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Próximamente
                </Badge>
              )}
              {isSelected && isAvailable && (
                <span className="text-[var(--tp-brand)]">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
        
        {showReset && source === 'manual' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={resetToAutoDetection} className="text-muted-foreground">
              <RotateCcw className="h-3 w-3 mr-2" />
              Detectar automáticamente
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground leading-tight">
            El país determina qué servicios están disponibles. 
            La moneda de pago se selecciona por separado.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
