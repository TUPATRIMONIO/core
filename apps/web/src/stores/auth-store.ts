import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { CoreUser, Organization, OrganizationMember } from '@/types/database'

interface Membership extends OrganizationMember {
  organization: Organization
}

interface AuthState {
  // Supabase auth
  user: User | null
  session: Session | null

  // Core user profile
  profile: CoreUser | null

  // Organizations
  memberships: Membership[]
  currentOrganization: Organization | null

  // Loading states
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: CoreUser | null) => void
  setMemberships: (memberships: Membership[]) => void
  setCurrentOrganization: (org: Organization | null) => void
  setIsLoading: (loading: boolean) => void
  setIsInitialized: (initialized: boolean) => void

  // Computed
  getCurrentMembership: () => Membership | null
  hasMultipleOrganizations: () => boolean

  // Reset
  reset: () => void
}

const initialState = {
  user: null,
  session: null,
  profile: null,
  memberships: [],
  currentOrganization: null,
  isLoading: true,
  isInitialized: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setMemberships: (memberships) => set({ memberships }),
      setCurrentOrganization: (org) => set({ currentOrganization: org }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsInitialized: (isInitialized) => set({ isInitialized }),

      getCurrentMembership: () => {
        const { memberships, currentOrganization } = get()
        if (!currentOrganization) return null
        return memberships.find(m => m.organization_id === currentOrganization.id) || null
      },

      hasMultipleOrganizations: () => {
        return get().memberships.length > 1
      },

      reset: () => set(initialState),
    }),
    {
      name: 'tupatrimonio-auth',
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
      }),
    }
  )
)
