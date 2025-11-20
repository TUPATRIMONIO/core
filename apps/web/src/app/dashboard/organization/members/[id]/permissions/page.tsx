'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

interface SchemaPermissions {
  [schema: string]: string[]
}

const AVAILABLE_PERMISSIONS = {
  signatures: {
    name: 'Firma Electrónica',
    actions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  notary: {
    name: 'Servicios Notariales',
    actions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  crm: {
    name: 'CRM',
    actions: ['view', 'create', 'edit', 'delete', 'manage'],
  },
  organization: {
    name: 'Organización',
    actions: ['view', 'edit', 'manage'],
  },
}

export default function MemberPermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, user: currentUser } = useAuthStore()

  const memberId = params.id as string

  const [member, setMember] = useState<any>(null)
  const [permissions, setPermissions] = useState<SchemaPermissions>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (currentOrganization && memberId) {
      loadMember()
    }
  }, [currentOrganization?.id, memberId])

  const loadMember = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load member
      const { data: memberData, error: memberError } = await supabase
        .schema('core')
        .from('organization_users')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url),
          role:roles(slug, name, level)
        `)
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (memberError || !memberData) {
        throw new Error('Miembro no encontrado')
      }

      setMember(memberData)

      // Load custom permissions
      const { data: permsData } = await supabase
        .schema('core')
        .from('user_permissions')
        .select('permissions')
        .eq('user_id', memberData.user_id)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle()

      if (permsData?.permissions) {
        setPermissions(permsData.permissions as SchemaPermissions)
      }
    } catch (error) {
      console.error('Error loading member:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el miembro',
        variant: 'destructive',
      })
      router.push('/dashboard/organization/members')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePermission = (schema: string, action: string) => {
    setPermissions((prev) => {
      const schemaPerms = prev[schema] || []
      const hasPermission = schemaPerms.includes(action)

      if (hasPermission) {
        // Remove permission
        return {
          ...prev,
          [schema]: schemaPerms.filter((a) => a !== action),
        }
      } else {
        // Add permission
        return {
          ...prev,
          [schema]: [...schemaPerms, action],
        }
      }
    })
  }

  const handleSave = async () => {
    if (!currentOrganization || !member) return

    setIsSaving(true)

    try {
      const supabase = createClient()

      // Upsert permissions
      const { error } = await supabase
        .schema('core')
        .from('user_permissions')
        .upsert({
          organization_id: currentOrganization.id,
          user_id: member.user_id,
          permissions,
          updated_by: currentUser?.id,
        })

      if (error) throw error

      toast({
        title: 'Permisos actualizados',
        description: 'Los permisos se han guardado correctamente',
      })

      router.push('/dashboard/organization/members')
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los permisos',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando permisos...
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Miembro no encontrado</p>
        <Button asChild>
          <Link href="/dashboard/organization/members">Volver a miembros</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/organization/members">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Permisos de {member.user.full_name || member.user.email}</h1>
            <p className="text-muted-foreground">
              Configura permisos específicos para este usuario
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

      {/* Member info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {member.user.avatar_url ? (
                <img
                  src={member.user.avatar_url}
                  alt={member.user.full_name || ''}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium">
                  {(member.user.full_name || member.user.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">{member.user.full_name || 'Sin nombre'}</p>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Rol base: <span className="font-medium">{member.role.name}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permisos personalizados
          </CardTitle>
          <CardDescription>
            Estos permisos se aplican además de los permisos base del rol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(AVAILABLE_PERMISSIONS).map(([schema, config]) => {
            const schemaPerms = permissions[schema] || []

            return (
              <div key={schema} className="space-y-3">
                <h3 className="font-medium">{config.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {config.actions.map((action) => {
                    const isActive = schemaPerms.includes(action)

                    return (
                      <label
                        key={action}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => togglePermission(schema, action)}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium capitalize">{action}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/organization/members">Cancelar</Link>
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar permisos'}
        </Button>
      </div>
    </div>
  )
}

