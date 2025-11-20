'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Currency } from '@/types/database'

export function useCurrency() {
  const { profile } = useAuthStore()
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string>('CLP')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCurrencies()
  }, [])

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency)
    }
  }, [profile?.default_currency])

  const loadCurrencies = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .schema('core')
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (data) {
        setCurrencies(data)
      }
    } catch (error) {
      console.error('Error loading currencies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserCurrency = async (currencyCode: string) => {
    if (!profile) return

    try {
      const supabase = createClient()
      await supabase
        .schema('core')
        .from('users')
        .update({ default_currency: currencyCode })
        .eq('id', profile.id)

      setSelectedCurrency(currencyCode)
    } catch (error) {
      console.error('Error updating currency:', error)
    }
  }

  const formatPrice = (price: number, currencyCode?: string) => {
    const currency = currencies.find(c => c.code === (currencyCode || selectedCurrency))
    if (!currency) return `${price}`

    const formatted = (price / 100).toFixed(currency.decimal_places)
    return `${currency.symbol} ${formatted}`
  }

  const getCurrency = (code: string) => {
    return currencies.find(c => c.code === code)
  }

  return {
    currencies,
    selectedCurrency,
    isLoading,
    updateUserCurrency,
    formatPrice,
    getCurrency,
  }
}

