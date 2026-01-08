'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { LocationManager, LocationResult } from '@tupatrimonio/location'
import { getCountryConfig, getSupportedCountries, CountryConfig } from '@tupatrimonio/location'
import { createClient } from '@/lib/supabase/client'

/**
 * Contexto global de país
 * 
 * Este contexto maneja la selección de país a nivel de la aplicación.
 * El país seleccionado afecta qué servicios se muestran, pero NO restringe
 * desde dónde el usuario puede acceder a la plataforma.
 */

interface GlobalCountryContextType {
  /** Código de país actual (ej: 'CL', 'MX') */
  country: string
  /** Información completa del país */
  countryInfo: CountryConfig | null
  /** Si se está cargando la detección inicial */
  isLoading: boolean
  /** Origen de la selección actual */
  source: 'manual' | 'organization' | 'auto' | 'fallback'
  /** Cambiar el país manualmente */
  setCountry: (countryCode: string) => void
  /** Resetear a la detección automática */
  resetToAutoDetection: () => void
  /** Lista de países soportados */
  supportedCountries: CountryConfig[]
}

const GlobalCountryContext = createContext<GlobalCountryContextType | undefined>(undefined)

const STORAGE_KEY = 'tp_global_country'

export function GlobalCountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string>('CL')
  const [source, setSource] = useState<'manual' | 'organization' | 'auto' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState(true)
  
  const supportedCountries = getSupportedCountries()
  const countryInfo = getCountryConfig(country.toLowerCase())

  // Inicialización: prioridad localStorage → organización → auto-detección → fallback
  useEffect(() => {
    const initializeCountry = async () => {
      try {
        // 1. Verificar localStorage
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.country) {
            setCountryState(parsed.country.toUpperCase())
            setSource('manual')
            setIsLoading(false)
            return
          }
        }

        // 2. Intentar obtener país de la organización
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: orgUser, error: orgUserError } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            .maybeSingle()
          
          if (!orgUserError && orgUser?.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('country')
              .eq('id', orgUser.organization_id)
              .maybeSingle()
            
            if (org?.country) {
              const orgCountry = org.country.toUpperCase()
              setCountryState(orgCountry)
              setSource('organization')
              setIsLoading(false)
              return
            }
          }
        }

        // 3. Auto-detección usando LocationManager
        const result = await LocationManager.getCurrentCountry()
        if (result.country) {
          setCountryState(result.country.toUpperCase())
          setSource(result.source === 'manual' ? 'manual' : 'auto')
          setIsLoading(false)
          return
        }

        // 4. Fallback
        setCountryState('CL')
        setSource('fallback')
      } catch (error) {
        console.error('[GlobalCountryProvider] Error initializing:', error)
        setCountryState('CL')
        setSource('fallback')
      } finally {
        setIsLoading(false)
      }
    }

    initializeCountry()
  }, [])

  // Escuchar cambios en el evento de ubicación
  useEffect(() => {
    const handleCountryChange = (event: CustomEvent) => {
      if (event.detail.country && event.detail.source === 'manual') {
        const newCountry = event.detail.country.toUpperCase()
        setCountryState(newCountry)
        setSource('manual')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('tp-country-changed', handleCountryChange as EventListener)
      return () => {
        window.removeEventListener('tp-country-changed', handleCountryChange as EventListener)
      }
    }
  }, [])

  const setCountry = useCallback((countryCode: string) => {
    const normalized = countryCode.toUpperCase()
    setCountryState(normalized)
    setSource('manual')
    
    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      country: normalized,
      timestamp: Date.now()
    }))
    
    // Sincronizar con LocationManager
    LocationManager.setUserPreference(normalized.toLowerCase())
    
    // Emitir evento para componentes que escuchen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tp-global-country-changed', {
        detail: { country: normalized, source: 'manual' }
      }))
    }
  }, [])

  const resetToAutoDetection = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    LocationManager.resetToAutoDetection()
    setIsLoading(true)
    
    // Re-detectar
    LocationManager.getCurrentCountry()
      .then((result) => {
        setCountryState(result.country.toUpperCase())
        setSource(result.source === 'manual' ? 'manual' : 'auto')
      })
      .catch(() => {
        setCountryState('CL')
        setSource('fallback')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const value: GlobalCountryContextType = {
    country,
    countryInfo,
    isLoading,
    source,
    setCountry,
    resetToAutoDetection,
    supportedCountries,
  }

  return (
    <GlobalCountryContext.Provider value={value}>
      {children}
    </GlobalCountryContext.Provider>
  )
}

/**
 * Hook para acceder al contexto global de país
 */
export function useGlobalCountry() {
  const context = useContext(GlobalCountryContext)
  if (context === undefined) {
    throw new Error('useGlobalCountry must be used within a GlobalCountryProvider')
  }
  return context
}

/**
 * Hook opcional que no falla si no hay provider (para componentes que pueden funcionar sin él)
 */
export function useGlobalCountryOptional() {
  return useContext(GlobalCountryContext)
}
