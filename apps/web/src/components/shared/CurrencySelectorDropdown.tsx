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
import { useGlobalCurrencyOptional } from '@/providers/GlobalCurrencyProvider'
import { ChevronDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CurrencySelectorDropdownProps {
  /** Variante de visualización */
  variant?: 'compact' | 'full' | 'sidebar'
  /** Clase CSS adicional */
  className?: string
}

/**
 * Selector global de moneda de pago
 * 
 * Permite al usuario seleccionar la moneda para realizar pagos.
 * La moneda es independiente del país seleccionado.
 */
export function CurrencySelectorDropdown({
  variant = 'compact',
  className,
}: CurrencySelectorDropdownProps) {
  const context = useGlobalCurrencyOptional()

  // Si no hay provider, mostrar un fallback simple
  if (!context) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <DollarSign className="h-4 w-4" />
        <span className="ml-1">USD</span>
      </Button>
    )
  }

  const { currency, currencyInfo, isLoading, setCurrency, supportedCurrencies } = context

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <DollarSign className="h-4 w-4 animate-pulse" />
      </Button>
    )
  }

  const symbol = currencyInfo?.symbol || '$'
  const code = currencyInfo?.code || currency
  const name = currencyInfo?.name || currency

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
          <span className="text-sm font-medium">{symbol}</span>
          <span className="text-sm font-medium hidden sm:inline">{code}</span>
          {variant === 'full' && (
            <span className="text-sm text-muted-foreground hidden md:inline">{name}</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align={variant === 'sidebar' ? 'start' : 'end'} 
        className="w-56"
      >
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          Moneda para pagos
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {supportedCurrencies.map((c) => {
          const isSelected = c.code.toUpperCase() === currency
          
          return (
            <DropdownMenuItem
              key={c.code}
              onClick={() => setCurrency(c.code)}
              className={cn(
                "flex items-center justify-between gap-2",
                isSelected && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.symbol}</span>
                <span className="text-sm font-medium">{c.code}</span>
                {variant === 'full' && (
                  <span className="text-xs text-muted-foreground">{c.name}</span>
                )}
              </div>
              {isSelected && (
                <span className="text-[var(--tp-buttons)]">✓</span>
              )}
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground leading-tight">
            La moneda seleccionada se usará para todos los pagos. 
            Es independiente del país de servicios.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
