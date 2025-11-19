import { create } from 'zustand'

interface PermissionsState {
  // Permissions map: schema -> actions[]
  permissions: Record<string, string[]>

  // Loading state
  isLoading: boolean

  // Actions
  setPermissions: (permissions: Record<string, string[]>) => void
  setIsLoading: (loading: boolean) => void

  // Check permission
  hasPermission: (schema: string, action: string) => boolean
  hasAnyPermission: (schema: string, actions: string[]) => boolean
  hasAllPermissions: (schema: string, actions: string[]) => boolean

  // Reset
  reset: () => void
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: {},
  isLoading: true,

  setPermissions: (permissions) => set({ permissions }),
  setIsLoading: (isLoading) => set({ isLoading }),

  hasPermission: (schema, action) => {
    const { permissions } = get()
    const schemaPermissions = permissions[schema]
    if (!schemaPermissions) return false
    return schemaPermissions.includes(action) || schemaPermissions.includes('manage')
  },

  hasAnyPermission: (schema, actions) => {
    const { hasPermission } = get()
    return actions.some(action => hasPermission(schema, action))
  },

  hasAllPermissions: (schema, actions) => {
    const { hasPermission } = get()
    return actions.every(action => hasPermission(schema, action))
  },

  reset: () => set({ permissions: {}, isLoading: true }),
}))

// Helper type for permission checks
export type PermissionCheck = {
  schema: string
  action: string
}
