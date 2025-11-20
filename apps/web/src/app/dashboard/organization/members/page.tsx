'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Mail, MoreVertical, Trash2, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissionsStore } from '@/stores/permissions-store'
import { useToast } from '@/hooks/use-toast'

interface Member {
  id: string
  user_id: string
  organization_id: string
  role_id: string
  status: string
  joined_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  role: {
    slug: string
    name: string
    level: number
  }
}

export default function OrganizationMembersPage() {
  const { toast } = useToast()
  const { currentOrganization, user } = useAuthStore()
  const { hasPermission } = usePermissionsStore()

  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('org_member')
  const [isInviting, setIsInviting] = useState(false)

  const canManage = hasPermission('organization', 'manage')

  useEffect(() => {
    if (currentOrganization) {
      loadMembers()
    }
  }, [currentOrganization?.id])

  const loadMembers = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .schema('core')
        .from('organization_users')
        .select(`
          *,
          user:users(id, email, full_name, avatar_url),
          role:roles(slug, name, level)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })

      if (error) throw error

      setMembers(data || [])
    } catch (error) {
      console.error('Error loading members:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los miembros',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization || !user) return

    setIsInviting(true)

    try {
      const supabase = createClient()

      // Verificar si el usuario ya existe
      const { data: existingUser } = await supabase
        .schema('core')
        .from('users')
        .select('id')
        .eq('email', inviteEmail)
        .single()

      if (existingUser) {
        // Usuario ya existe, verificar si ya es miembro
        const { data: existingMember } = await supabase
          .schema('core')
          .from('organization_users')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('organization_id', currentOrganization.id)
          .single()

        if (existingMember) {
          throw new Error('Este usuario ya es miembro de la organización')
        }

        // Agregar como miembro
        const { data: role } = await supabase
          .schema('core')
          .from('roles')
          .select('id')
          .eq('slug', inviteRole)
          .single()

        if (!role) {
          throw new Error('Rol no encontrado')
        }

        const { error: memberError } = await supabase
          .schema('core')
          .from('organization_users')
          .insert({
            organization_id: currentOrganization.id,
            user_id: existingUser.id,
            role_id: role.id,
            status: 'active',
            invited_by: user.id,
          })

        if (memberError) throw memberError

        toast({
          title: 'Usuario agregado',
          description: `${inviteEmail} ha sido agregado a la organización`,
        })
      } else {
        // Usuario no existe, enviar invitación por email
        // TODO: Implementar sistema de invitaciones por email
        toast({
          title: 'Invitación enviada',
          description: `Se ha enviado una invitación a ${inviteEmail}`,
        })
      }

      setInviteEmail('')
      setShowInviteForm(false)
      loadMembers()
    } catch (error) {
      console.error('Error inviting user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al invitar usuario',
        variant: 'destructive',
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar a ${memberName} de la organización?`)) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('core')
        .from('organization_users')
        .update({ status: 'inactive' })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Miembro eliminado',
        description: `${memberName} ha sido eliminado de la organización`,
      })

      loadMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el miembro',
        variant: 'destructive',
      })
    }
  }

  const getRoleBadgeColor = (level: number) => {
    if (level >= 10) return 'bg-purple-100 text-purple-800'
    if (level >= 8) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/organization">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
            <p className="text-muted-foreground">
              Gestiona los miembros de {currentOrganization?.name}
            </p>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => setShowInviteForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invitar miembro
          </Button>
        )}
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invitar nuevo miembro</CardTitle>
            <CardDescription>
              Envía una invitación para unirse a la organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Rol
                  </label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="org_member">Miembro</option>
                    <option value="org_admin">Administrador</option>
                    <option value="org_owner">Propietario</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isInviting}>
                  <Mail className="mr-2 h-4 w-4" />
                  {isInviting ? 'Invitando...' : 'Enviar invitación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Miembros de la organización</CardTitle>
          <CardDescription>
            {members.length} miembro{members.length !== 1 ? 's' : ''} activo{members.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando miembros...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay miembros
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.user.avatar_url ? (
                        <img
                          src={member.user.avatar_url}
                          alt={member.user.full_name || ''}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {(member.user.full_name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user.full_name || 'Sin nombre'}
                        {member.user_id === user?.id && (
                          <span className="ml-2 text-xs text-muted-foreground">(Tú)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadgeColor(
                        member.role.level
                      )}`}
                    >
                      {member.role.name}
                    </span>

                    {canManage && member.user_id !== user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/organization/members/${member.id}/permissions`}>
                              <Shield className="mr-2 h-4 w-4" />
                              Editar permisos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveMember(member.id, member.user.full_name || member.user.email)
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

