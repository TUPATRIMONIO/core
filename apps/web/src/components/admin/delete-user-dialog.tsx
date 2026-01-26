'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/card' // Nota: AlertDialog suele estar en su propio archivo, verificaré luego
import { Button } from '@/components/ui/button'
import { 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  Users, 
  Ticket, 
  FileText, 
  Mail, 
  Key,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import { 
  getUserDependencies, 
  deleteUserWithCleanup, 
  getPotentialReassignees 
} from '@/app/actions/user-management'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Re-importar AlertDialog desde el lugar correcto si falló arriba
import {
  AlertDialog as ShadcnAlertDialog,
  AlertDialogAction as ShadcnAlertDialogAction,
  AlertDialogCancel as ShadcnAlertDialogCancel,
  AlertDialogContent as ShadcnAlertDialogContent,
  AlertDialogDescription as ShadcnAlertDialogDescription,
  AlertDialogFooter as ShadcnAlertDialogFooter,
  AlertDialogHeader as ShadcnAlertDialogHeader,
  AlertDialogTitle as ShadcnAlertDialogTitle,
  AlertDialogTrigger as ShadcnAlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DeleteUserDialogProps {
  userId: string
  userName: string
  userEmail: string
  trigger?: React.ReactNode
}

export function DeleteUserDialog({ userId, userName, userEmail, trigger }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dependencies, setDependencies] = useState<any>(null)
  const [potentialUsers, setPotentialUsers] = useState<any[]>([])
  const [reassignTo, setReassignTo] = useState<string>('')
  const [actionType, setActionType] = useState<'reassign' | 'delete'>('reassign')
  const router = useRouter()

  const hasDependencies = dependencies && Object.values(dependencies).some((count: any) => count > 0)

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  async function loadData() {
    setLoading(true)
    try {
      const [depsRes, usersRes] = await Promise.all([
        getUserDependencies(userId),
        getPotentialReassignees()
      ])

      if (depsRes.success) setDependencies(depsRes.data)
      if (usersRes.success) {
        // Filtrar al usuario actual de la lista de reasignación
        setPotentialUsers(usersRes.data.filter((u: any) => u.id !== userId))
      }
    } catch (error) {
      toast.error('Error al cargar información del usuario')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setError(null)
    if (actionType === 'reassign' && !reassignTo && hasDependencies) {
      setError('Debes seleccionar un usuario para reasignar los datos')
      return
    }

    setDeleting(true)
    try {
      const res = await deleteUserWithCleanup({
        userId,
        reassignToUserId: actionType === 'reassign' ? reassignTo : undefined,
        deleteData: actionType === 'delete'
      })

      if (res.success) {
        toast.success('Usuario eliminado correctamente')
        setOpen(false)
        router.push('/admin/users')
        router.refresh()
      } else {
        setError(res.error || 'Error al eliminar el usuario')
        toast.error(res.error || 'Error al eliminar el usuario')
      }
    } catch (error: any) {
      const msg = error.message || 'Error inesperado al eliminar el usuario'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const dependencyItems = [
    { key: 'organization_users', label: 'Membresías en Organizaciones', icon: Users },
    { key: 'team_leads', label: 'Liderazgo de Teams', icon: UserPlus },
    { key: 'tickets_assigned', label: 'Tickets Asignados', icon: Ticket },
    { key: 'tickets_created', label: 'Tickets Creados', icon: Ticket },
    { key: 'support_tickets', label: 'Tickets de Soporte', icon: Ticket },
    { key: 'signing_documents', label: 'Documentos de Firma', icon: FileText },
    { key: 'email_accounts', label: 'Cuentas de Email', icon: Mail },
    { key: 'api_keys_created', label: 'API Keys', icon: Key },
  ].filter(item => dependencies?.[item.key] > 0)

  return (
    <ShadcnAlertDialog open={open} onOpenChange={setOpen}>
      <ShadcnAlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Usuario
          </Button>
        )}
      </ShadcnAlertDialogTrigger>
      
      <ShadcnAlertDialogContent className="max-w-2xl">
        <ShadcnAlertDialogHeader>
          <ShadcnAlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Usuario Permanentemente
          </ShadcnAlertDialogTitle>
          <ShadcnAlertDialogDescription>
            Estás a punto de eliminar a <strong>{userName}</strong> ({userEmail}). 
            Esta acción no se puede deshacer.
          </ShadcnAlertDialogDescription>
        </ShadcnAlertDialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analizando dependencias del usuario...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {hasDependencies ? (
              <>
                <div className="bg-muted/50 rounded-lg p-4 border border-warning/20">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Registros vinculados encontrados:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dependencyItems.map((item) => (
                      <div key={item.key} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{item.label}</span>
                        </div>
                        <Badge variant="secondary">{dependencies[item.key]}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base">¿Qué deseas hacer con estos registros?</Label>
                  <RadioGroup 
                    value={actionType} 
                    onValueChange={(v: any) => setActionType(v)}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-start space-x-3 space-y-0 bg-muted/30 p-3 rounded-lg border">
                      <RadioGroupItem value="reassign" id="reassign" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="reassign" className="font-medium cursor-pointer">Reasignar a otro usuario</Label>
                        <p className="text-sm text-muted-foreground">
                          Transfiere la propiedad y asignaciones a otro administrador.
                        </p>
                        
                        {actionType === 'reassign' && (
                          <div className="pt-3">
                            <Select value={reassignTo} onValueChange={setReassignTo}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar usuario destino..." />
                              </SelectTrigger>
                              <SelectContent>
                                {potentialUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.full_name || 'Sin nombre'} ({u.id.substring(0, 8)}...)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 space-y-0 bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                      <RadioGroupItem value="delete" id="delete" className="mt-1" />
                      <div className="space-y-1">
                        <Label htmlFor="delete" className="font-medium cursor-pointer text-destructive">Eliminar o desvincular datos</Label>
                        <p className="text-sm text-muted-foreground">
                          Borra los registros vinculados o los deja sin asignar (NULL).
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
              </>
            ) : (
              <div className="bg-success/10 text-success rounded-lg p-4 border border-success/20 flex items-center gap-3">
                <div className="bg-success/20 p-2 rounded-full">
                  <ChevronRight className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">
                  No se encontraron dependencias críticas. El usuario puede ser eliminado de forma segura.
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mx-6 mb-4 bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <ShadcnAlertDialogFooter>
          <ShadcnAlertDialogCancel disabled={deleting}>Cancelar</ShadcnAlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading || deleting || (actionType === 'reassign' && !reassignTo && hasDependencies)}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Confirmar Eliminación'
            )}
          </Button>
        </ShadcnAlertDialogFooter>
      </ShadcnAlertDialogContent>
    </ShadcnAlertDialog>
  )
}
