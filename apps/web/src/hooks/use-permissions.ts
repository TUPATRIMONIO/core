'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/stores/permissions-store'

export function usePermissions() {
  const { user, currentOrganization } = useAuthStore()
  const {
    permissions,
    isLoading,
    setPermissions,
    setIsLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reset,
  } = usePermissionsStore()

  useEffect(() => {
    if (!user || !currentOrganization) {
      reset()
      return
    }

    loadPermissions()
  }, [user?.id, currentOrganization?.id])

  const loadPermissions = async () => {
    if (!user || !currentOrganization) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get user's role in organization
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (!membership) {
        setPermissions({})
        return
      }

      // Base permissions by role
      const basePermissions = getRolePermissions(membership.role)

      // Get custom permissions for this user in this org
      const { data: customPermissions } = await supabase
        .from('user_permissions')
        .select('schema_name, permissions')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)

      // Merge base with custom permissions
      const mergedPermissions = { ...basePermissions }

      if (customPermissions) {
        for (const custom of customPermissions) {
          if (mergedPermissions[custom.schema_name]) {
            // Merge arrays, removing duplicates
            mergedPermissions[custom.schema_name] = [
              ...new Set([
                ...mergedPermissions[custom.schema_name],
                ...custom.permissions,
              ]),
            ]
          } else {
            mergedPermissions[custom.schema_name] = custom.permissions
          }
        }
      }

      setPermissions(mergedPermissions)
    } catch (error) {
      console.error('Error loading permissions:', error)
      setPermissions({})
    } finally {
      setIsLoading(false)
    }
  }

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    reload: loadPermissions,
  }
}

// Default permissions by role
function getRolePermissions(role: string): Record<string, string[]> {
  switch (role) {
    case 'org_owner':
      return {
        organization: ['manage'],
        signatures: ['manage'],
        notary: ['manage'],
        crm: ['manage'],
      }
    case 'org_admin':
      return {
        organization: ['view', 'edit'],
        signatures: ['view', 'create', 'edit'],
        notary: ['view', 'create', 'edit'],
        crm: ['view', 'create', 'edit'],
      }
    case 'org_member':
      return {
        signatures: ['view', 'create'],
        notary: ['view', 'create'],
        crm: ['view'],
      }
    default:
      return {}
  }
}
