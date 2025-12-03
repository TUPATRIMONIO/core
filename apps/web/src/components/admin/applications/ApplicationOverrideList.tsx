'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Override {
  id: string
  organization_id: string
  is_enabled: boolean
  expires_at?: string
  organizations?: {
    id: string
    name: string
    slug: string
    country?: string
    is_beta_tester?: boolean
  }
}

interface ApplicationOverrideListProps {
  applicationId: string
  overrides: Override[]
  onAddOverride: (organizationId: string, isEnabled: boolean, expiresAt?: string) => Promise<void>
  onUpdateOverride: (overrideId: string, organizationId: string, isEnabled: boolean, expiresAt?: string) => Promise<void>
  onDeleteOverride: (overrideId: string) => Promise<void>
}

export function ApplicationOverrideList({
  applicationId,
  overrides,
  onAddOverride,
  onUpdateOverride,
  onDeleteOverride,
}: ApplicationOverrideListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newOrgId, setNewOrgId] = useState('')
  const [newIsEnabled, setNewIsEnabled] = useState(true)
  const [newExpiresAt, setNewExpiresAt] = useState<Date | null>(null)

  const handleAddOverride = async () => {
    if (!newOrgId) return

    startTransition(async () => {
      try {
        await onAddOverride(
          newOrgId,
          newIsEnabled,
          newExpiresAt?.toISOString()
        )
        setIsDialogOpen(false)
        setNewOrgId('')
        setNewIsEnabled(true)
        setNewExpiresAt(null)
      } catch (error) {
        console.error('Error adding override:', error)
      }
    })
  }

  const handleToggleOverride = async (overrideId: string, currentValue: boolean) => {
    const override = overrides.find(o => o.id === overrideId)
    if (!override) return

    startTransition(async () => {
      try {
        await onUpdateOverride(
          overrideId,
          override.organization_id,
          !currentValue,
          override.expires_at
        )
      } catch (error) {
        console.error('Error updating override:', error)
      }
    })
  }

  const handleDelete = async (overrideId: string) => {
    if (!confirm('¿Estás seguro de eliminar este override?')) return

    startTransition(async () => {
      try {
        await onDeleteOverride(overrideId)
      } catch (error) {
        console.error('Error deleting override:', error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Overrides por Organización</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Agregar Override
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-id">ID de Organización</Label>
                <Input
                  id="org-id"
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                  placeholder="UUID de la organización"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newIsEnabled}
                  onCheckedChange={setNewIsEnabled}
                />
                <Label>Habilitado</Label>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Expiración (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newExpiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newExpiresAt ? (
                        format(newExpiresAt, "PPP", { locale: es })
                      ) : (
                        <span>Sin fecha de expiración</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newExpiresAt || undefined}
                      onSelect={(date) => setNewExpiresAt(date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleAddOverride} disabled={isPending || !newOrgId}>
                Agregar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {overrides.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay overrides configurados. Los overrides permiten habilitar o deshabilitar
          una aplicación para organizaciones específicas.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organización</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overrides.map((override) => (
              <TableRow key={override.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {override.organizations?.name || 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {override.organizations?.slug || override.organization_id}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {override.organizations?.country ? (
                    <Badge variant="outline">{override.organizations.country.toUpperCase()}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={override.is_enabled}
                    onCheckedChange={() => handleToggleOverride(override.id, override.is_enabled)}
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell>
                  {override.expires_at ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(override.expires_at), "PPP", { locale: es })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sin expiración</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(override.id)}
                    disabled={isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

