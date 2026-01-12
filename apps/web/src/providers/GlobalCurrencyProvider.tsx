'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useGlobalCountryOptional } from './GlobalCountryProvider'

/**
 * Configuración de monedas soportadas por Stripe y dLocalGo
 */
export interface CurrencyConfig {
  code: string      // 'USD', 'CLP', etc.
  symbol: string    // '$', '€', etc.
  name: string      // 'Dólar estadounidense'
  decimals: number  // 2 para USD, 0 para CLP
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar estadounidense',
    decimals: 2,
  },
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Peso chileno',
    decimals: 0,
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso mexicano',
    decimals: 2,
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso colombiano',
    decimals: 2,
  },
  PEN: {
    code: 'PEN',
    symbol: 'S/',
    name: 'Sol peruano',
    decimals: 2,
  },
  ARS: {
    code: 'ARS',
    symbol: '$',
    name: 'Peso argentino',
    decimals: 2,
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real brasileño',
    decimals: 2,
  },
}

/**
 * Obtiene todas las monedas soportadas como array
 */
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(SUPPORTED_CURRENCIES)
}

/**
 * Obtiene la configuración de una moneda
 */
export function getCurrencyConfig(code: string): CurrencyConfig | null {
  return SUPPORTED_CURRENCIES[code.toUpperCase()] || null
}

/**
 * Obtiene la moneda por defecto basada en el país
 */
export function getDefaultCurrencyForCountry(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    CL: 'CLP',
    AR: 'ARS',
    CO: 'COP',
    MX: 'MXN',
    PE: 'PEN',
    BR: 'BRL',
    US: 'USD',
  }
  
  return currencyMap[countryCode.toUpperCase()] || 'USD'
}

/**
 * Contexto global de moneda
 * 
 * Este contexto maneja la selección de moneda de pago a nivel de la aplicación.
 * La moneda seleccionada es independiente del país y se usa para todos los pagos.
 */
interface GlobalCurrencyContextType {
  /** Código de moneda actual (ej: 'USD', 'CLP') */
  currency: string
  /** Información completa de la moneda */
  currencyInfo: CurrencyConfig | null
  /** Si se está cargando la inicialización */
  isLoading: boolean
  /** Origen de la selección actual */
  source: 'manual' | 'country' | 'fallback'
  /** Cambiar la moneda manualmente */
  setCurrency: (currencyCode: string) => void
  /** Lista de monedas soportadas */
  supportedCurrencies: CurrencyConfig[]
}

const GlobalCurrencyContext = createContext<GlobalCurrencyContextType | undefined>(undefined)

const STORAGE_KEY = 'tp_global_currency'

export function GlobalCurrencyProvider({ children }: { children: React.ReactNode }) {
  const countryContext = useGlobalCountryOptional()
  const [currency, setCurrencyState] = useState<string>('USD')
  const [source, setSource] = useState<'manual' | 'country' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState(true)
  
  const supportedCurrencies = getSupportedCurrencies()
  const currencyInfo = getCurrencyConfig(currency)

  // Inicialización: prioridad localStorage → moneda del país → fallback
  useEffect(() => {
    try {
      // 1. Verificar localStorage PRIMERO (solo en cliente)
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.currency && SUPPORTED_CURRENCIES[parsed.currency.toUpperCase()]) {
              setCurrencyState(parsed.currency.toUpperCase())
              setSource('manual')
              setIsLoading(false)
              return
            }
          } catch (parseError) {
            console.warn('[GlobalCurrencyProvider] Error parsing stored currency:', parseError)
            // Continuar con la siguiente opción
          }
        }
      }

      // 2. Usar moneda del país si está disponible
      if (countryContext?.country) {
        const countryCurrency = getDefaultCurrencyForCountry(countryContext.country)
        if (SUPPORTED_CURRENCIES[countryCurrency]) {
          setCurrencyState(countryCurrency)
          setSource('country')
          setIsLoading(false)
          return
        }
      }

      // 3. Fallback a USD
      setCurrencyState('USD')
      setSource('fallback')
    } catch (error) {
      console.error('[GlobalCurrencyProvider] Error initializing:', error)
      setCurrencyState('USD')
      setSource('fallback')
    } finally {
      setIsLoading(false)
    }
  }, []) // Solo se ejecuta al montar

  // Sincronizar con cambios de país (solo si no hay selección manual y ya se inicializó)
  useEffect(() => {
    if (isLoading || source === 'manual') return // No cambiar si hay selección manual o aún está cargando
    
    if (countryContext?.country) {
      const countryCurrency = getDefaultCurrencyForCountry(countryContext.country)
      if (SUPPORTED_CURRENCIES[countryCurrency] && countryCurrency !== currency) {
        setCurrencyState(countryCurrency)
        setSource('country')
      }
    }
  }, [countryContext?.country, source, currency, isLoading])

  const setCurrency = useCallback((currencyCode: string) => {
    const normalized = currencyCode.toUpperCase()
    if (!SUPPORTED_CURRENCIES[normalized]) {
      console.warn(`[GlobalCurrencyProvider] Moneda no soportada: ${normalized}`)
      return
    }
    
    // Si es la misma moneda, no hacer nada
    if (normalized === currency) {
      return
    }
    
    setCurrencyState(normalized)
    setSource('manual')
    
    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currency: normalized,
        timestamp: Date.now()
      }))
      
      // Emitir evento para componentes que escuchen
      window.dispatchEvent(new CustomEvent('tp-global-currency-changed', {
        detail: { currency: normalized, source: 'manual' }
      }))
      
      // Refrescar la página para aplicar los cambios inmediatamente
      window.location.reload()
    }
  }, [currency])

  const value: GlobalCurrencyContextType = {
    currency,
    currencyInfo,
    isLoading,
    source,
    setCurrency,
    supportedCurrencies,
  }

  return (
    <GlobalCurrencyContext.Provider value={value}>
      {children}
    </GlobalCurrencyContext.Provider>
  )
}

/**
 * Hook para acceder al contexto global de moneda
 */
export function useGlobalCurrency() {
  const context = useContext(GlobalCurrencyContext)
  if (context === undefined) {
    throw new Error('useGlobalCurrency must be used within a GlobalCurrencyProvider')
  }
  return context
}

/**
 * Hook opcional que no falla si no hay provider (para componentes que pueden funcionar sin él)
 */
export function useGlobalCurrencyOptional() {
  return useContext(GlobalCurrencyContext)
}
