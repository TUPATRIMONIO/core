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
        .schema('core')
        .from('organization_users')
        .select(`
          role:roles(slug, name)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .single()

      if (!membership || !membership.role) {
        setPermissions({})
        return
      }

      // Base permissions by role
      const roleSlug = membership.role.slug
      const basePermissions = getRolePermissions(roleSlug)

      // Get custom permissions for this user in this org
      const { data: customPermissionsData } = await supabase
        .schema('core')
        .from('user_permissions')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle()

      // Merge base with custom permissions
      const mergedPermissions = { ...basePermissions }

      if (customPermissionsData?.permissions) {
        // Parse JSONB permissions: {"schema_name": ["action1", "action2"]}
        const customPerms = customPermissionsData.permissions as Record<string, string[]>
        
        for (const [schemaName, actions] of Object.entries(customPerms)) {
          if (mergedPermissions[schemaName]) {
            // Merge arrays, removing duplicates
            mergedPermissions[schemaName] = [
              ...new Set([
                ...mergedPermissions[schemaName],
                ...actions,
              ]),
            ]
          } else {
            mergedPermissions[schemaName] = actions
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
