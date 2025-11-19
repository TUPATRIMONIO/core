'use client'

import { useEffect, type ReactNode } from 'react'
import { useUser } from '@/hooks/use-user'
import { usePermissions } from '@/hooks/use-permissions'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize user and permissions on mount
  useUser()
  usePermissions()

  return <>{children}</>
}
