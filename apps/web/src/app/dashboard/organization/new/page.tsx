'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function NewOrganizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setCurrentOrganization, setMemberships, memberships } = useAuthStore()

  const [organizationName, setOrganizationName] = useState('')
  const [orgType, setOrgType] = useState<'personal' | 'business'>('business')
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

      // Generate slug
      const slug = organizationName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Check if slug exists
      const { data: existingOrg } = await supabase
        .schema('core')
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingOrg) {
        throw new Error('Ya existe una organización con ese nombre')
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .schema('core')
        .from('organizations')
        .insert({
          name: organizationName,
          slug: slug,
          is_personal: orgType === 'personal',
          org_type: orgType,
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

      // Reload memberships
      const { data: membershipData } = await supabase
        .schema('core')
        .from('organization_users')
        .select(`
          *,
          organization:organizations(*),
          role:roles(slug, name)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (membershipData) {
        const transformedMemberships = membershipData.map(m => ({
          ...m,
          role: m.role?.slug || 'org_member',
        }))
        setMemberships(transformedMemberships)
      }

      // Set as current organization
      setCurrentOrganization(org)

      toast({
        title: 'Organización creada',
        description: 'Tu organización se ha creado correctamente',
      })

      router.push('/dashboard/organization')
    } catch (error) {
      console.error('Error creating organization:', error)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/organization">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva organización</h1>
          <p className="text-muted-foreground">
            Crea una nueva organización para tu equipo o empresa
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información de la organización
          </CardTitle>
          <CardDescription>
            Los datos básicos de tu nueva organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="orgName" className="text-sm font-medium">
                Nombre de la organización *
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
              <p className="text-xs text-muted-foreground">
                Este nombre será visible para todos los miembros de la organización
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de organización *</label>
              <div className="grid gap-4 md:grid-cols-2">
                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    orgType === 'personal'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    value="personal"
                    checked={orgType === 'personal'}
                    onChange={(e) => setOrgType(e.target.value as 'personal' | 'business')}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Personal</div>
                    <div className="text-sm text-muted-foreground">
                      Para uso individual
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    orgType === 'business'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    value="business"
                    checked={orgType === 'business'}
                    onChange={(e) => setOrgType(e.target.value as 'personal' | 'business')}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Empresarial</div>
                    <div className="text-sm text-muted-foreground">
                      Para equipos y empresas
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/organization">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={isLoading || !organizationName}>
                {isLoading ? 'Creando...' : 'Crear organización'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

