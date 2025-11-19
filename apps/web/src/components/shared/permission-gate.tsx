'use client'

import type { ReactNode } from 'react'
import { usePermissionsStore } from '@/stores/permissions-store'

interface PermissionGateProps {
  children: ReactNode
  schema: string
  action: string
  fallback?: ReactNode
}

export function PermissionGate({
  children,
  schema,
  action,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissionsStore()

  if (isLoading) {
    return null
  }

  if (!hasPermission(schema, action)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
