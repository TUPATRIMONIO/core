'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addTeamMember } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

interface AddTeamMemberDialogProps {
  teamId: string
  organizationId: string
}

export function AddTeamMemberDialog({
  teamId,
  organizationId,
}: AddTeamMemberDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [userId, setUserId] = useState('')
  const [teamRole, setTeamRole] = useState('member')
  
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [teamMembers, setTeamMembers] = useState<string[]>([])

  // Cargar usuarios de la organización que no están en el team
  useEffect(() => {
    if (open) {
      const loadUsers = async () => {
        const supabase = createClient()
        
        // Obtener miembros actuales del team
        const { data: currentMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId)

        const memberIds = currentMembers?.map((m: any) => m.user_id) || []
        setTeamMembers(memberIds)

        // Obtener usuarios de la organización
        const { data: orgUsers } = await supabase
          .from('organization_users')
          .select(`
            user_id,
            users(id, full_name)
          `)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .not('user_id', 'in', `(${memberIds.length > 0 ? memberIds.join(',') : 'null'})`)

        if (orgUsers) {
          const userIds = orgUsers.map((ou: any) => ou.user_id)
          const { data: usersData } = await supabase
            .from('users')
            .select('id, full_name')
            .in('id', userIds)

          // Email no disponible desde cliente (requiere admin API)
          const usersWithEmail = (usersData || []).map((user: any) => ({
            ...user,
            email: '', // Email no disponible desde cliente
          }))

          setUsers(usersWithEmail)
        }
      }
      loadUsers()
    } else {
      setUserId('')
      setTeamRole('member')
      setError('')
    }
  }, [open, teamId, organizationId])

  const handleAdd = async () => {
    if (!userId) {
      setError('Por favor selecciona un usuario')
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await addTeamMember(teamId, userId, teamRole)

      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Miembro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Miembro al Team</DialogTitle>
          <DialogDescription>
            Selecciona un usuario de la organización para agregar al team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="user">Usuario *</Label>
            <Select value={userId} onValueChange={setUserId} disabled={loading}>
              <SelectTrigger id="user">
                <SelectValue placeholder="Selecciona un usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.length > 0 ? (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No hay usuarios disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_role">Rol en el Team</Label>
            <Select value={teamRole} onValueChange={setTeamRole} disabled={loading}>
              <SelectTrigger id="team_role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Miembro</SelectItem>
                <SelectItem value="lead">Líder</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={loading || !userId}
            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

