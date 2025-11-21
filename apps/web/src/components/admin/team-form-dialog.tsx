'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTeam, updateTeam } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface TeamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: {
    id: string
    name: string
    description?: string | null
    organization_id: string
    lead_user_id?: string | null
    color?: string | null
  } | null
  defaultOrganizationId?: string
}

export function TeamFormDialog({
  open,
  onOpenChange,
  team,
  defaultOrganizationId,
}: TeamFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || '')
  const [leadUserId, setLeadUserId] = useState('')
  const [color, setColor] = useState('#3B82F6')
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  // Pre-llenar formulario si es edición
  useEffect(() => {
    if (team) {
      setName(team.name)
      setDescription(team.description || '')
      setOrganizationId(team.organization_id)
      setLeadUserId(team.lead_user_id || '')
      setColor(team.color || '#3B82F6')
    } else {
      setName('')
      setDescription('')
      setOrganizationId(defaultOrganizationId || '')
      setLeadUserId('')
      setColor('#3B82F6')
    }
    setError('')
  }, [team, open, defaultOrganizationId])

  // Cargar organizaciones y usuarios
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        const supabase = createClient()
        
        // Cargar organizaciones
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name')
        
        if (orgs) {
          setOrganizations(orgs)
        }

        // Cargar usuarios si hay organización seleccionada
        if (organizationId) {
          const { data: orgUsers } = await supabase
            .from('organization_users')
            .select(`
              user_id,
              users(id, full_name)
            `)
            .eq('organization_id', organizationId)
            .eq('status', 'active')

          if (orgUsers) {
            const userIds = orgUsers.map((ou: any) => ou.user_id)
            const { data: usersData } = await supabase
              .from('users')
              .select('id, full_name')
              .in('id', userIds)

            // Obtener emails
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            
            const usersWithEmail = (usersData || []).map((user: any) => ({
              ...user,
              email: authUsers?.users.find((au: any) => au.id === user.id)?.email || '',
            }))

            setUsers(usersWithEmail)
          }
        }
      }
      loadData()
    }
  }, [open, organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('organization_id', organizationId)
    if (leadUserId) {
      formData.append('lead_user_id', leadUserId)
    }
    formData.append('color', color)

    try {
      const result = team
        ? await updateTeam(team.id, formData)
        : await createTeam(formData)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {team ? 'Editar Team' : 'Crear Team'}
          </DialogTitle>
          <DialogDescription>
            {team
              ? 'Modifica la información del team'
              : 'Completa los datos para crear un nuevo team'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Equipo de Ventas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Descripción del team..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organización *</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
                disabled={loading || !!defaultOrganizationId}
              >
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Selecciona una organización" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_user">Líder del Team</Label>
              <Select
                value={leadUserId}
                onValueChange={setLeadUserId}
                disabled={loading || !organizationId}
              >
                <SelectTrigger id="lead_user">
                  <SelectValue placeholder="Selecciona un líder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin líder</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
              {loading ? 'Guardando...' : team ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

