'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Mail, User, Search, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ReviewerManagerProps {
  document: any
  reviewers: any[]
  onUpdate: () => void
}

export function ReviewerManager({ document, reviewers, onUpdate }: ReviewerManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const supabase = createClient()

  // Verificar si se pueden agregar revisores (solo en borrador)
  const canModify = document.status === 'draft'

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Buscar usuarios de la misma organización
      // Nota: Esto asume una vista o función para buscar usuarios
      // Usaremos core.organization_users para obtener IDs y luego users
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener org del usuario actual
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()
      
      if (!orgUser) return

      // Buscar usuarios en la org
      // TODO: Optimizar esto con una RPC dedicada
      const { data: users } = await supabase
        .from('organization_users')
        .select('user:users(id, full_name, email, avatar_url)')
        .eq('organization_id', orgUser.organization_id)
        .eq('status', 'active')
      
      if (!users) return

      // Filtrar localmente por query
      const filtered = users
        .map((u: any) => u.user)
        .filter((u: any) => 
          u.full_name.toLowerCase().includes(query.toLowerCase()) || 
          u.email.toLowerCase().includes(query.toLowerCase())
        )
        // Excluir los que ya son revisores
        .filter((u: any) => !reviewers.some((r) => r.user_id === u.id))

      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddReviewer = async (userId: string) => {
    try {
      // Usar la RPC submit_document_for_review para agregar revisores
      // Aunque el nombre sugiere "enviar", si el documento está en draft, 
      // esto solo agrega revisores si se combina con lógica, o necesitamos una RPC separada para agregar individualmente.
      // Revisando la RPC `submit_document_for_review`, toma un array de IDs.
      // Si llamamos con [userId], lo intentará agregar.
      // Pero esa RPC CAMBIA el estado a 'pending_review'.
      // Si queremos SOLO agregar sin cambiar estado, necesitamos insertar directo en la tabla reviewers.
      
      // Vamos a insertar directamente por ahora ya que tenemos RLS policies
      const { error } = await supabase
        .from('reviewers')
        .insert({
          document_id: document.id,
          user_id: userId,
          status: 'pending'
        })

      if (error) throw new Error(error.message)

      toast.success('Revisor agregado')
      setIsAdding(false)
      setSearchQuery('')
      setSearchResults([])
      onUpdate()

    } catch (error: any) {
      toast.error(error.message || 'Error al agregar revisor')
    }
  }

  const handleRemoveReviewer = async (reviewerId: string) => {
    if (!confirm('¿Estás seguro de quitar a este revisor?')) return

    try {
      const { error } = await supabase
        .from('reviewers')
        .delete()
        .eq('id', reviewerId)

      if (error) throw new Error(error.message)

      toast.success('Revisor removido')
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || 'Error al remover revisor')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>
      case 'needs_changes':
        return <Badge variant="outline" className="text-orange-600 border-orange-200">Cambios</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Revisores</CardTitle>
          <CardDescription>
            Personas que deben aprobar este documento antes de la firma.
          </CardDescription>
        </div>
        
        {canModify && (
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Revisor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Revisor</DialogTitle>
                <DialogDescription>
                  Busca usuarios en tu organización para asignarlos como revisores.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {isSearching ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">Buscando...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.full_name?.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <p className="font-medium leading-none">{user.full_name}</p>
                            <p className="text-muted-foreground text-xs">{user.email}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAddReviewer(user.id)}>Add</Button>
                      </div>
                    ))
                  ) : searchQuery.length > 2 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">No se encontraron usuarios</div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">Escribe para buscar...</div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No se han asignado revisores.
                </TableCell>
              </TableRow>
            ) : (
              reviewers.map((reviewer) => (
                <TableRow key={reviewer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reviewer.user?.avatar_url} />
                        <AvatarFallback>{reviewer.user?.full_name?.substring(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{reviewer.user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{reviewer.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(reviewer.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {reviewer.review_comment || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {canModify && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveReviewer(reviewer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
