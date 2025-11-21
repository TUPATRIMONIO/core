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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignRoleToUser, removeUserFromOrganization } from '@/lib/admin/actions'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AssignRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  userId: string
  userName: string
  currentRoleId?: string
  currentRoleName?: string
  onSuccess?: () => void
}

export function AssignRoleDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  userName,
  currentRoleId,
  currentRoleName,
  onSuccess,
}: AssignRoleDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState<Array<{ id: string; name: string; slug: string; level: number }>>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')

  // Cargar roles disponibles
  useEffect(() => {
    if (open) {
      const loadRoles = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('roles')
          .select('id, name, slug, level')
          .order('level', { ascending: false })

        if (error) {
          console.error('Error loading roles:', error)
        } else {
          setRoles(data || [])
          if (currentRoleId) {
            setSelectedRoleId(currentRoleId)
          }
        }
      }
      loadRoles()
    }
  }, [open, currentRoleId])

  const handleAssignRole = async () => {
    if (!selectedRoleId) {
      setError('Por favor selecciona un rol')
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await assignRoleToUser(organizationId, userId, selectedRoleId)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
        onSuccess?.()
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`¿Estás seguro de que deseas remover a ${userName} de esta organización?`)) {
      return
    }

    setError('')
    setLoading(true)

    try {
      const result = await removeUserFromOrganization(organizationId, userId)

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.refresh()
        onSuccess?.()
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
          <DialogTitle>Gestionar Rol de Usuario</DialogTitle>
          <DialogDescription>
            {currentRoleName ? (
              <>
                Usuario: <strong>{userName}</strong>
                <br />
                Rol actual: <strong>{currentRoleName}</strong>
              </>
            ) : (
              <>Asignar rol a: <strong>{userName}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} (Nivel {role.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {currentRoleId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemove}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Remover de Organización
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAssignRole}
              disabled={loading || !selectedRoleId}
              className="flex-1 sm:flex-none bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {loading ? 'Guardando...' : currentRoleId ? 'Actualizar Rol' : 'Asignar Rol'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

