'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type AssignmentStatus =
  | 'pending'
  | 'received'
  | 'in_progress'
  | 'needs_correction'
  | 'needs_documents'
  | 'completed'
  | 'rejected'

interface NotaryDashboardClientProps {
  officeId: string
  officeName: string
  initialAssignments: any[]
  documentsById: Record<string, any>
  orgsById: Record<string, any>
}

function statusBadge(status: AssignmentStatus) {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary">Pendiente</Badge>
    case 'received':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Recibido</Badge>
    case 'in_progress':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En proceso</Badge>
    case 'needs_correction':
      return <Badge variant="destructive">Requiere corrección</Badge>
    case 'needs_documents':
      return <Badge variant="destructive">Faltan documentos</Badge>
    case 'completed':
      return <Badge className="bg-green-600 text-white">Completado</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rechazado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function NotaryDashboardClient({
  officeId,
  officeName,
  initialAssignments,
  documentsById,
  orgsById,
}: NotaryDashboardClientProps) {
  const supabase = useMemo(() => createClient(), [])

  const [assignments, setAssignments] = useState<any[]>(initialAssignments)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadAssignment, setUploadAssignment] = useState<any | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDocumentId, setUploadDocumentId] = useState('') // opcional: pegar link/UUID desde QR

  const refresh = async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('signing_notary_assignments')
        .select('*')
        .eq('notary_office_id', officeId)
        .order('assigned_at', { ascending: false })

      if (fetchError) throw fetchError
      setAssignments(data || [])
    } catch (e: any) {
      console.error('[NotaryDashboard] refresh error', e)
      setError(e?.message || 'No se pudo actualizar el listado.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const updateStatus = async (assignmentId: string, status: AssignmentStatus) => {
    setError(null)
    try {
      const patch: any = { status }
      if (status === 'received') patch.received_at = new Date().toISOString()
      if (status === 'completed') patch.completed_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('signing_notary_assignments')
        .update(patch)
        .eq('id', assignmentId)

      if (updateError) throw updateError

      toast.success('Estado actualizado')
      await refresh()
    } catch (e: any) {
      console.error('[NotaryDashboard] update status error', e)
      setError(e?.message || 'No se pudo actualizar el estado.')
    }
  }

  const openUpload = (assignment: any) => {
    setUploadAssignment(assignment)
    setUploadFile(null)
    setUploadDocumentId('')
    setUploadOpen(true)
  }

  const submitUpload = async () => {
    setError(null)

    if (!uploadAssignment?.id) {
      setError('Asignación inválida.')
      return
    }
    if (!uploadFile) {
      setError('Debes seleccionar un PDF notariado.')
      return
    }

    try {
      setUploading(true)

      const fd = new FormData()
      fd.set('assignmentId', uploadAssignment.id)
      fd.set('documentId', uploadDocumentId)
      fd.set('file', uploadFile)

      const res = await fetch('/api/notary/notarized-upload', {
        method: 'POST',
        body: fd,
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(json?.error || 'Error subiendo archivo')
      }

      toast.success('Documento notariado subido y registrado')
      setUploadOpen(false)
      await refresh()
    } catch (e: any) {
      console.error('[NotaryDashboard] upload error', e)
      setError(e?.message || 'No se pudo subir el documento.')
    } finally {
      setUploading(false)
    }
  }

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {
      pending: [],
      action: [],
      completed: [],
      rejected: [],
    }

    for (const a of assignments) {
      const s = a.status as AssignmentStatus
      if (s === 'completed') groups.completed.push(a)
      else if (s === 'rejected') groups.rejected.push(a)
      else if (s === 'needs_correction' || s === 'needs_documents') groups.action.push(a)
      else groups.pending.push(a)
    }

    return groups
  }, [assignments])

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="text-sm text-muted-foreground p-6 text-center">
          No hay documentos en esta sección.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {list.map((a) => {
          const doc = documentsById[a.document_id]
          const org = doc?.organization_id ? orgsById[doc.organization_id] : null

          return (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{doc?.title || a.document_id}</div>
                    <div className="text-xs text-muted-foreground">
                      Cliente: {org?.name || doc?.organization_id || '—'}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(a.status)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {a.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'received')}>
                      Marcar recibido
                    </Button>
                  )}
                  {(a.status === 'received' || a.status === 'pending') && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'in_progress')}>
                      Iniciar
                    </Button>
                  )}

                  {(a.status === 'in_progress' || a.status === 'received') && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'needs_documents')}>
                      Solicitar docs
                    </Button>
                  )}

                  {(a.status === 'in_progress' || a.status === 'received') && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'needs_correction')}>
                      Solicitar corrección
                    </Button>
                  )}

                  {(a.status === 'in_progress' || a.status === 'received') && (
                    <Button size="sm" onClick={() => openUpload(a)}>
                      Subir PDF notariado
                    </Button>
                  )}

                  {a.status !== 'completed' && a.status !== 'rejected' && (
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(a.id, 'rejected')}>
                      Rechazar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir documento notariado</DialogTitle>
            <DialogDescription>
              Sube el PDF final notariado para cerrar el ciclo. Si quieres, pega el link o UUID que aparece en el QR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Documento (desde QR) · opcional</Label>
              <Input
                value={uploadDocumentId}
                onChange={(e) => setUploadDocumentId(e.target.value)}
                placeholder="https://tupatrimonio.app/repository/<uuid> o solo <uuid>"
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label>PDF notariado</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Solo PDF. El sistema lo guardará en el repositorio del documento correspondiente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button
              onClick={submitUpload}
              disabled={uploading}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                'Subir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Notaría</div>
          <div className="text-lg font-bold">{officeName}</div>
        </div>
        <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            'Actualizar'
          )}
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="action">Requieren acción</TabsTrigger>
          <TabsTrigger value="completed">Completados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderList(grouped.pending)}
        </TabsContent>
        <TabsContent value="action" className="mt-4">
          {renderList(grouped.action)}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderList(grouped.completed)}
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          {renderList(grouped.rejected)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

