'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export function useUser() {
  const {
    user,
    profile,
    memberships,
    currentOrganization,
    isLoading,
    isInitialized,
    setUser,
    setSession,
    setProfile,
    setMemberships,
    setCurrentOrganization,
    setIsLoading,
    setIsInitialized,
    reset,
  } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          setSession(session)
          await loadUserData(session.user.id)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setIsLoading(false)
      } finally {
        setIsInitialized(true)
      }
    }

    // Load user profile and organizations
    const loadUserData = async (userId: string) => {
      try {
        // Get profile
        const { data: profileData } = await supabase
          .schema('core')
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileData) {
          setProfile(profileData)
        }

        // Get memberships with organizations and roles
        const { data: membershipData } = await supabase
          .schema('core')
          .from('organization_users')
          .select(`
            *,
            organization:organizations(*),
            role:roles(slug, name)
          `)
          .eq('user_id', userId)
          .eq('status', 'active')

        if (membershipData) {
          // Transform data to match expected structure
          const transformedMemberships = membershipData.map(m => ({
            ...m,
            role: m.role?.slug || 'org_member', // Use role slug as role
          }))
          
          setMemberships(transformedMemberships)

          // Auto-select organization if only one
          if (transformedMemberships.length === 1 && !currentOrganization) {
            setCurrentOrganization(transformedMemberships[0].organization)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          setSession(session)
          await loadUserData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          reset()
          setIsInitialized(true)
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
  }

  const switchOrganization = async (organizationId: string) => {
    const membership = memberships.find(m => m.organization_id === organizationId)
    if (membership) {
      setCurrentOrganization(membership.organization)
    }
  }

  return {
    user,
    profile,
    memberships,
    currentOrganization,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    signOut,
    switchOrganization,
  }
}
