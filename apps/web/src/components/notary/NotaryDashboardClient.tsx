'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload, Download, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import { BulkUploadDialog } from './BulkUploadDialog'
import { DocumentViewerModal } from './DocumentViewerModal'

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
  ordersById: Record<string, { id: string; order_number: string }>
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

const notaryServiceLabels: Record<string, string> = {
  'none': 'Sin notarización',
  'legalized_copy': 'Copia legalizada',
  'protocolization': 'Protocolización',
  'authorized_signature': 'Firma autorizada'
}

export function NotaryDashboardClient({
  officeId,
  officeName,
  initialAssignments,
  documentsById,
  orgsById,
  ordersById,
}: NotaryDashboardClientProps) {
  const supabase = useMemo(() => createClient(), [])

  const [assignments, setAssignments] = useState<any[]>(initialAssignments)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modal de visualización
  const [viewerDocumentId, setViewerDocumentId] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)

  // Descarga masiva
  const [isDownloadingBulk, setIsDownloadingBulk] = useState(false)

  // Subida masiva (nuevo flujo principal)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

  // Subida individual (flujo legacy - opcional)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadAssignment, setUploadAssignment] = useState<any | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDocumentId, setUploadDocumentId] = useState('') // opcional: pegar link/UUID desde QR
  const [actionOpen, setActionOpen] = useState(false)
  const [actionType, setActionType] = useState<AssignmentStatus | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionAssignment, setActionAssignment] = useState<any | null>(null)

  // Sincronizar estado cuando cambien las props iniciales
  useEffect(() => {
    setAssignments(initialAssignments)
    // Limpiar selección si los assignments cambian
    setSelectedIds(new Set())
  }, [initialAssignments])

  const toggleSelection = (documentId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(documentId)) {
        newSet.delete(documentId)
      } else {
        newSet.add(documentId)
      }
      return newSet
    })
  }

  const toggleSelectAll = (list: any[]) => {
    const listDocIds = list.map((a) => a.document_id).filter(Boolean)
    const allSelected = listDocIds.every((id) => selectedIds.has(id))

    if (allSelected) {
      // Deseleccionar todos de esta lista
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        listDocIds.forEach((id) => newSet.delete(id))
        return newSet
      })
    } else {
      // Seleccionar todos de esta lista
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        listDocIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const openViewer = (documentId: string) => {
    setViewerDocumentId(documentId)
    setViewerOpen(true)
  }

  const handleDownloadSingle = async (documentId: string) => {
    try {
      const response = await fetch(`/api/notary/document-info?documentId=${documentId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'No se pudo obtener información del documento')
      }

      const { signedUrl, title } = await response.json()

      // Descargar archivo como blob para forzar descarga (no abrir en navegador)
      const fileResponse = await fetch(signedUrl)
      if (!fileResponse.ok) {
        throw new Error('No se pudo descargar el archivo')
      }

      const blob = await fileResponse.blob()
      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Liberar el objeto URL después de un momento
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)

      toast.success('Descarga iniciada')
    } catch (error: any) {
      console.error('Error downloading document:', error)
      toast.error(error.message || 'Error al descargar el documento')
    }
  }

  const handleBulkDownload = async () => {
    if (selectedIds.size === 0) {
      toast.error('No hay documentos seleccionados')
      return
    }

    try {
      setIsDownloadingBulk(true)

      const response = await fetch('/api/notary/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentIds: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al descargar documentos')
      }

      // Descargar el ZIP
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documentos-notaria-${new Date().toISOString().split('T')[0]}.zip`
      link.click()
      window.URL.revokeObjectURL(url)

      toast.success(`${selectedIds.size} documento(s) descargado(s)`)
      clearSelection()
    } catch (error: any) {
      console.error('Error bulk download:', error)
      toast.error(error.message || 'Error al descargar documentos')
    } finally {
      setIsDownloadingBulk(false)
    }
  }

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

  const updateStatus = async (
    assignmentId: string,
    status: AssignmentStatus,
    reason?: string
  ) => {
    setError(null)
    try {
      const patch: any = { status }
      if (status === 'received') patch.received_at = new Date().toISOString()
      if (status === 'completed') patch.completed_at = new Date().toISOString()
      if (status === 'needs_correction' || status === 'needs_documents') {
        patch.correction_request = reason || null
      }
      if (status === 'rejected') {
        patch.rejection_reason = reason || null
      }

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

  const openAction = (assignment: any, status: AssignmentStatus) => {
    setActionAssignment(assignment)
    setActionType(status)
    setActionReason('')
    setActionOpen(true)
  }

  const submitAction = async () => {
    if (!actionAssignment?.id || !actionType) {
      setError('Acción inválida.')
      return
    }

    try {
      await updateStatus(actionAssignment.id, actionType, actionReason.trim() || undefined)
      setActionOpen(false)
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar el estado.')
    }
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

    const listDocIds = list.map((a) => a.document_id).filter(Boolean)
    const allSelected = listDocIds.length > 0 && listDocIds.every((id) => selectedIds.has(id))
    const someSelected = listDocIds.some((id) => selectedIds.has(id))

    return (
      <div className="space-y-3">
        {/* Selector "todos" */}
        {list.length > 1 && (
          <div className="flex items-center gap-2 px-2 py-1">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => toggleSelectAll(list)}
              aria-label="Seleccionar todos"
            />
            <span className="text-sm text-muted-foreground">
              {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </div>
        )}

        {list.map((a) => {
          const doc = documentsById[a.document_id]
          const org = doc?.organization_id ? orgsById[doc.organization_id] : null
          const order = doc?.order_id ? ordersById[doc.order_id] : null
          const isSelected = selectedIds.has(a.document_id)

          return (
            <Card key={a.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {/* Checkbox de selección */}
                  <div className="pt-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(a.document_id)}
                      aria-label={`Seleccionar ${doc?.title || a.document_id}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{doc?.title || a.document_id}</div>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      {order?.order_number && (
                        <div>N° Pedido: <span className="font-mono">{order.order_number}</span></div>
                      )}
                      <div>Cliente: {org?.name || doc?.organization_id || '—'}</div>
                      {doc?.notary_service && (
                        <div>Tipo: {notaryServiceLabels[doc.notary_service] || doc.notary_service}</div>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Asignado: {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : '—'}
                      {a.received_at ? ` · Recibido: ${new Date(a.received_at).toLocaleString()}` : ''}
                      {a.completed_at ? ` · Completado: ${new Date(a.completed_at).toLocaleString()}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(a.status)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openViewer(a.document_id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver documento
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadSingle(a.document_id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
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
                    <Button size="sm" variant="outline" onClick={() => openAction(a, 'needs_documents')}>
                      Solicitar docs
                    </Button>
                  )}

                  {(a.status === 'in_progress' || a.status === 'received') && (
                    <Button size="sm" variant="outline" onClick={() => openAction(a, 'needs_correction')}>
                      Solicitar corrección
                    </Button>
                  )}

                  {(a.status === 'in_progress' || a.status === 'received') && (
                    <Button size="sm" onClick={() => openUpload(a)}>
                      Subir PDF notariado
                    </Button>
                  )}

                  {a.status !== 'completed' && a.status !== 'rejected' && (
                    <Button size="sm" variant="destructive" onClick={() => openAction(a, 'rejected')}>
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

      {/* Modal de visualización de documentos */}
      <DocumentViewerModal
        documentId={viewerDocumentId}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />

      {/* Subida masiva (nuevo flujo principal) */}
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
        onComplete={refresh}
      />

      {/* Subida individual (legacy - mantener como backup) */}
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

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar observación</DialogTitle>
            <DialogDescription>
              Deja el motivo para que nuestro equipo interno lo gestione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Describe el motivo de la observación o rechazo..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitAction}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra de acciones masivas */}
      {selectedIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedIds.size} seleccionado(s)
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Deseleccionar todos
                </Button>
              </div>
              <Button
                onClick={handleBulkDownload}
                disabled={isDownloadingBulk}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {isDownloadingBulk ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar seleccionados (ZIP)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Notaría</div>
          <div className="text-lg font-bold">{officeName}</div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setBulkUploadOpen(true)}
            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            <Upload className="mr-2 h-4 w-4" />
            Subir documentos notarizados
          </Button>
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

