'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseApplicationAccessOptions {
  organizationId?: string
  autoRefresh?: boolean
}

interface UseApplicationAccessResult {
  hasAccess: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook para verificar si el usuario actual tiene acceso a una aplicación específica
 */
export function useApplicationAccess(
  applicationSlug: string,
  options: UseApplicationAccessOptions = {}
): UseApplicationAccessResult {
  const { organizationId, autoRefresh = true } = options
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const checkAccess = useCallback(async () => {
    if (!applicationSlug) {
      setHasAccess(false)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setHasAccess(false)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/admin/applications/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_slug: applicationSlug,
          organization_id: organizationId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al verificar acceso')
      }

      const data = await response.json()
      setHasAccess(data.hasAccess || false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }, [applicationSlug, organizationId])

  useEffect(() => {
    checkAccess()

    if (autoRefresh) {
      // Refrescar cada 5 minutos
      const interval = setInterval(checkAccess, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [checkAccess, autoRefresh])

  return {
    hasAccess,
    isLoading,
    error,
    refetch: checkAccess,
  }
}

/**
 * Hook para obtener la lista de aplicaciones habilitadas para el usuario actual
 */
export function useEnabledApplications(
  options: UseApplicationAccessOptions = {}
): {
  applications: string[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const { organizationId } = options
  const [applications, setApplications] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setApplications([])
        setIsLoading(false)
        return
      }

      // Obtener organización si no se proporciona
      let finalOrgId = organizationId
      if (!finalOrgId) {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('joined_at', { ascending: false })
          .limit(1)
          .single()

        if (orgUser) {
          finalOrgId = orgUser.organization_id
        }
      }

      if (!finalOrgId) {
        setApplications([])
        setIsLoading(false)
        return
      }

      // Llamar a la función SQL
      const { data: enabledApplications, error: rpcError } = await supabase.rpc(
        'get_enabled_applications',
        {
          p_organization_id: finalOrgId,
          p_user_id: user.id,
        }
      )

      if (rpcError) {
        throw rpcError
      }

      setApplications((enabledApplications || []).map((a: any) => a.slug))
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error desconocido')
      setError(error)
      setApplications([])
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications])

  return {
    applications,
    isLoading,
    error,
    refetch: fetchApplications,
  }
}

