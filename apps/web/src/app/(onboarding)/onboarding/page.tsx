'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setCurrentOrganization, setMemberships } = useAuthStore()

  const [organizationName, setOrganizationName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Get owner role ID
      const { data: ownerRole } = await supabase
        .schema('core')
        .from('roles')
        .select('id')
        .eq('slug', 'org_owner')
        .single()

      if (!ownerRole) {
        throw new Error('Error al obtener rol de propietario')
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .schema('core')
        .from('organizations')
        .insert({
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          is_personal: false,
        })
        .select()
        .single()

      if (orgError || !org) {
        throw new Error('Error al crear la organización')
      }

      // Create membership
      const { error: memberError } = await supabase
        .schema('core')
        .from('organization_users')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role_id: ownerRole.id,
          status: 'active',
        })

      if (memberError) {
        throw new Error('Error al crear membresía')
      }

      // Create credits balance
      await supabase
        .schema('core')
        .from('organization_credits')
        .insert({
          organization_id: org.id,
          balance: 0,
        })

      // Update user's last active org
      await supabase
        .schema('core')
        .from('users')
        .update({ last_active_organization_id: org.id })
        .eq('id', user.id)

      // Update store
      const membership = {
        id: crypto.randomUUID(),
        organization_id: org.id,
        user_id: user.id,
        role: { slug: 'org_owner', name: 'Organization Owner' },
        created_at: new Date().toISOString(),
        organization: org,
      }
      setMemberships([membership])
      setCurrentOrganization(org)

      toast({
        title: 'Organización creada',
        description: 'Tu organización se ha creado correctamente',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error in onboarding:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear la organización',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-2xl">Crea tu organización</CardTitle>
        <CardDescription>
          Para comenzar, crea una organización para tu equipo o empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="orgName" className="text-sm font-medium">
              Nombre de la organización
            </label>
            <input
              id="orgName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Mi Empresa S.A."
              required
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !organizationName}>
            {isLoading ? 'Creando...' : 'Crear organización'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
