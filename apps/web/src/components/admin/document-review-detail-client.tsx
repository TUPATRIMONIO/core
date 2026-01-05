'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle, XCircle, AlertCircle, MessageSquare, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentMessageThread } from './document-message-thread'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface DocumentReviewDetailClientProps {
  document: any
  messages: any[]
  signers: any[]
}

export function DocumentReviewDetailClient({
  document,
  messages: initialMessages,
  signers,
}: DocumentReviewDetailClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState(initialMessages)
  const [action, setAction] = useState<'approve' | 'reject' | 'request_correction' | null>(null)
  const [comment, setComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const aiReview = document.ai_review?.[0]

  const handleAction = async () => {
    if (!action) return

    if (action === 'request_correction' && !comment.trim()) {
      toast.error('Debes agregar un comentario al solicitar corrección')
      return
    }

    setIsSubmitting(true)

    try {
      // Crear mensaje si hay comentario
      if (comment.trim()) {
        const { error: msgError } = await supabase
          .from('signing_document_messages')
          .insert({
            document_id: document.id,
            message: comment,
            is_internal: isInternal,
          })

        if (msgError) throw msgError
      }

      // Actualizar estado del documento
      let newStatus = ''
      if (action === 'approve') {
        newStatus = 'pending_signature'
      } else if (action === 'reject') {
        newStatus = 'rejected'
      } else if (action === 'request_correction') {
        newStatus = 'needs_correction'
      }

      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({ status: newStatus })
        .eq('id', document.id)

      if (updateError) throw updateError

      toast.success(
        action === 'approve' ? 'Documento aprobado' :
        action === 'reject' ? 'Documento rechazado' :
        'Corrección solicitada'
      )

      router.push('/admin/document-review')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al procesar acción')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDocumentUrl = async () => {
    if (!document.original_file_path) return null

    const { data } = await supabase.storage
      .from('docs-originals')
      .createSignedUrl(document.original_file_path, 3600)

    return data?.signedUrl || null
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Panel izquierdo: Información y acciones */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Título</Label>
              <p className="font-medium">{document.title}</p>
            </div>
            {document.description && (
              <div>
                <Label className="text-sm text-muted-foreground">Descripción</Label>
                <p>{document.description}</p>
              </div>
            )}
            <div>
              <Label className="text-sm text-muted-foreground">Estado</Label>
              <div className="mt-1">
                <Badge variant={document.status === 'needs_correction' ? 'destructive' : 'secondary'}>
                  {document.status === 'manual_review' ? 'Revisión Manual' : 'Necesita Corrección'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Organización</Label>
              <p>{document.organization?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Creado por</Label>
              <p>{document.created_by_user?.full_name || document.created_by_user?.email || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Firmantes</Label>
              <p>{signers.length} firmante(s)</p>
            </div>
            {document.original_file_path && (
              <div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const url = await getDocumentUrl()
                    if (url) window.open(url, '_blank')
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {aiReview && (
          <Card>
            <CardHeader>
              <CardTitle>Revisión IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Resultado</Label>
                <div className="mt-1">
                  {aiReview.status === 'approved' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprobado
                    </Badge>
                  )}
                  {aiReview.status === 'rejected' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rechazado
                    </Badge>
                  )}
                  {aiReview.status === 'needs_changes' && (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Observado
                    </Badge>
                  )}
                </div>
              </div>
              {aiReview.confidence_score && (
                <div>
                  <Label className="text-sm text-muted-foreground">Confianza</Label>
                  <p>{(aiReview.confidence_score * 100).toFixed(1)}%</p>
                </div>
              )}
              {aiReview.reasons && aiReview.reasons.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Observaciones</Label>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    {aiReview.reasons.map((reason: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        <Badge variant={reason.level === 'high' ? 'destructive' : 'secondary'} className="mr-2">
                          {reason.level}
                        </Badge>
                        {reason.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>Aprueba, rechaza o solicita correcciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Comentario</Label>
              <Textarea
                placeholder="Agrega un comentario sobre tu decisión..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="internal"
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor="internal" className="text-sm">
                Mensaje interno (solo visible para el equipo)
              </Label>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => setAction('approve')}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Aprobar documento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El documento pasará a estado "pending_signature" y se enviará a los firmantes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAction}>Aprobar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setAction('reject')}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Rechazar documento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El documento será rechazado definitivamente. Esta acción puede iniciar un proceso de reembolso.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAction} className="bg-destructive">
                      Rechazar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAction('request_correction')}
                    disabled={isSubmitting}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Solicitar Corrección
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Solicitar corrección?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El documento pasará a estado "needs_correction" y el cliente podrá subir una versión corregida.
                      {!comment.trim() && (
                        <span className="block mt-2 text-destructive">
                          Debes agregar un comentario explicando qué necesita corregirse.
                        </span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleAction}
                      disabled={!comment.trim()}
                    >
                      Solicitar Corrección
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel derecho: Mensajes */}
      <div>
        <DocumentMessageThread
          documentId={document.id}
          initialMessages={messages}
          onMessageAdded={(newMessage) => {
            setMessages([...messages, newMessage])
          }}
        />
      </div>
    </div>
  )
}

