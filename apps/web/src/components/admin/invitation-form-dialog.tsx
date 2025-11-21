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
import { sendInvitation } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface InvitationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultOrganizationId?: string
}

export function InvitationFormDialog({
  open,
  onOpenChange,
  defaultOrganizationId,
}: InvitationFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [email, setEmail] = useState('')
  const [organizationId, setOrganizationId] = useState(defaultOrganizationId || '')
  const [roleId, setRoleId] = useState('')
  const [message, setMessage] = useState('')
  
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([])
  const [roles, setRoles] = useState<Array<{ id: string; name: string; slug: string }>>([])

  // Cargar organizaciones y roles
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
          if (defaultOrganizationId) {
            setOrganizationId(defaultOrganizationId)
          }
        }

        // Cargar roles
        const { data: rolesData } = await supabase
          .from('roles')
          .select('id, name, slug')
          .order('level', { ascending: false })

        if (rolesData) {
          setRoles(rolesData)
        }
      }
      loadData()
    } else {
      // Reset al cerrar
      setEmail('')
      setOrganizationId(defaultOrganizationId || '')
      setRoleId('')
      setMessage('')
      setError('')
    }
  }, [open, defaultOrganizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !organizationId || !roleId) {
      setError('Email, organización y rol son campos requeridos')
      return
    }

    // Validar email
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError('Email inválido')
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('organization_id', organizationId)
    formData.append('role_id', roleId)
    if (message) {
      formData.append('message', message)
    }

    try {
      const result = await sendInvitation(formData)

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Invitación</DialogTitle>
          <DialogDescription>
            Invita a un usuario a unirse a una organización con un rol específico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="usuario@ejemplo.com"
            />
          </div>

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
            <Label htmlFor="role">Rol *</Label>
            <Select value={roleId} onValueChange={setRoleId} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="Mensaje personalizado para la invitación..."
              rows={3}
            />
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
            <Button
              type="submit"
              disabled={loading || !email || !organizationId || !roleId}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {loading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

