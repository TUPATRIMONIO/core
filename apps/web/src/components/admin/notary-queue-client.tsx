'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, RefreshCw, ExternalLink, MessageSquare, Paperclip, X, FileText, History } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { RestartOrderAdminModal } from './RestartOrderAdminModal'
import { NotaryAssignmentChat } from '@/components/notary/NotaryAssignmentChat'

interface NotaryQueueClientProps {
  initialAssignments: any[]
}

function statusBadge(status: string) {
  switch (status) {
    case 'needs_correction':
      return <Badge variant="destructive">Requiere corrección</Badge>
    case 'needs_documents':
      return <Badge variant="destructive">Faltan documentos</Badge>
    case 'rejected':
      return <Badge variant="destructive">Rechazado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function NotaryQueueClient({ initialAssignments }: NotaryQueueClientProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState(initialAssignments)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null)
  
  // Estado para resolución
  const [adminNotes, setAdminNotes] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estado para reinicio
  const [restartModalOpen, setRestartModalOpen] = useState(false)
  const [restartOrder, setRestartOrder] = useState<any | null>(null)

  // Estado para chat
  const [chatAssignmentId, setChatAssignmentId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const openResolveDialog = (assignment: any) => {
    setSelectedAssignment(assignment)
    setAdminNotes('')
    setAttachments([])
    setResolveDialogOpen(true)
  }

  const openChat = (assignmentId: string) => {
    setChatAssignmentId(assignmentId)
    setChatOpen(true)
  }

  const openRestartModal = (assignment: any) => {
    if (!assignment.document?.order_id) {
      toast.error('Este documento no tiene un pedido asociado para reiniciar.')
      return
    }

    // Construir objeto order mínimo necesario para el modal
    const orderData = {
      id: assignment.document.order_id,
      order_number: '...', // No lo tenemos en la vista actual, pero el modal lo usa para mostrar
      amount: 0, // No relevante para la lógica de reinicio si no se cobra
      currency: 'CLP',
      status: 'processing',
      signing_document: {
        id: assignment.document.id,
        status: assignment.document.status,
        signers_count: 0,
        signed_count: 0,
        title: assignment.document.title
      }
    }
    
    setRestartOrder(orderData)
    setRestartModalOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleResolveSubmit = async () => {
    if (!selectedAssignment) return

    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const uploadedAttachments = []

      // 1. Subir archivos si existen
      if (attachments.length > 0) {
        for (const file of attachments) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${selectedAssignment.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `notary-attachments/${fileName}`

          // Usar bucket 'docs' o el que esté disponible
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('docs')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Error uploading file:', uploadError)
            toast.error(`Error al subir ${file.name}: ${uploadError.message}`)
            continue
          }

          uploadedAttachments.push({
            path: filePath,
            name: file.name,
            size: file.size,
            type: file.type
          })
        }
      }

      // 2. Llamar API de resolución
      const response = await fetch('/api/admin/notary-queue/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignmentId: selectedAssignment.id,
          adminNotes,
          attachments: uploadedAttachments
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al resolver la observación')
      }

      toast.success('Observación resuelta y documento reenviado a notaría')
      
      // Actualizar lista localmente
      setAssignments(prev => prev.filter(a => a.id !== selectedAssignment.id))
      setResolveDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Documentos con observaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No hay observaciones pendientes.
            </div>
          ) : (
            assignments.map((a: any) => (
              <div key={a.id} className="rounded-lg border p-4 space-y-2 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      {a.document?.title || a.document?.id}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cliente: {a.document?.organization?.name || a.document?.organization_id || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Notaría: {a.notary_office?.name || '—'}
                    </div>
                    <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                      Asignado: {new Date(a.assigned_at).toLocaleString('es-CL')}
                    </div>
                  </div>
                  <div className="shrink-0">{statusBadge(a.status)}</div>
                </div>

                {(a.correction_request || a.rejection_reason) && (
                  <div className="text-sm text-muted-foreground border-l-2 border-[var(--tp-lines-30)] pl-3 bg-muted/30 py-2 pr-2 rounded-r">
                    <span className="font-medium text-foreground">Observación: </span>
                    {a.correction_request || a.rejection_reason}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    size="sm" 
                    className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                    onClick={() => openResolveDialog(a)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resolver y reenviar
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-primary/80 hover:bg-primary/10"
                    onClick={() => openChat(a.id)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Ver historial
                  </Button>

                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => openRestartModal(a)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Corregir (Reiniciar)
                  </Button>

                  <a
                    href={`/dashboard/signing/documents/${a.document?.id}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver documento
                    </Button>
                  </a>
                  
                  <a
                    href="/admin/communications/tickets/new"
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Crear ticket al cliente
                    </Button>
                  </a>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal de Resolución */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resolver observación</DialogTitle>
            <DialogDescription>
              Agrega comentarios o documentos adicionales para la notaría y reenvía el caso.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas para la notaría</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Se adjunta certificado de vigencia actualizado..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Documentos adicionales (Opcional)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Adjuntar archivos
                </Button>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
              </div>
              
              {attachments.length > 0 && (
                <div className="space-y-2 mt-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResolveSubmit} 
              disabled={isSubmitting}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar reenvío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reinicio */}
      {restartOrder && (
        <RestartOrderAdminModal
          order={restartOrder}
          open={restartModalOpen}
          onOpenChange={setRestartModalOpen}
          onSuccess={() => {
            setAssignments(prev => prev.filter(a => a.id !== selectedAssignment?.id)) // Opcional: remover de la lista si cambia de estado
            router.refresh()
          }}
        />
      )}

      {/* Chat de historial */}
      <NotaryAssignmentChat
        assignmentId={chatAssignmentId}
        open={chatOpen}
        onOpenChange={setChatOpen}
        title="Historial de Observaciones"
      />
    </>
  )
}
