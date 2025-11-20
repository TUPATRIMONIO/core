'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { OrganizationCredits, CreditTransaction } from '@/types/database'

export function useCredits() {
  const { currentOrganization } = useAuthStore()
  const [credits, setCredits] = useState<OrganizationCredits | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!currentOrganization) {
      setCredits(null)
      setTransactions([])
      setIsLoading(false)
      return
    }

    loadCredits()
    subscribeToCredits()
  }, [currentOrganization?.id])

  const loadCredits = async () => {
    if (!currentOrganization) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get current balance
      const { data: creditsData } = await supabase
        .schema('core')
        .from('organization_credits')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .single()

      setCredits(creditsData)

      // Get recent transactions
      const { data: txData } = await supabase
        .schema('core')
        .from('credit_transactions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setTransactions(txData || [])
    } catch (error) {
      console.error('Error loading credits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribeToCredits = () => {
    if (!currentOrganization) return

    const supabase = createClient()

    // Subscribe to credit changes
    const subscription = supabase
      .channel(`credits-${currentOrganization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'core',
          table: 'organization_credits',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCredits(payload.new as OrganizationCredits)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'core',
          table: 'credit_transactions',
          filter: `organization_id=eq.${currentOrganization.id}`,
        },
        (payload) => {
          if (payload.new) {
            setTransactions(prev => [payload.new as CreditTransaction, ...prev])
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  return {
    balance: credits?.balance ?? 0,
    credits,
    transactions,
    isLoading,
    reload: loadCredits,
  }
}
