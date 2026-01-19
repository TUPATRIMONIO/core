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
import { CheckCircle, XCircle, AlertCircle, MessageSquare, FileText, Download, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentMessageThread } from './document-message-thread'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PDFViewer } from '@/components/signing/PDFViewer'
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
  const [isRegenerating, setIsRegenerating] = useState(false)

  const aiReview = document.ai_review?.[0]

  const handleAction = async () => {
    if (!action) return

    if (action === 'request_correction' && !comment.trim()) {
      toast.error('Debes agregar un comentario al solicitar corrección')
      return
    }

    setIsSubmitting(true)

    try {
      // Usar el endpoint de API para manejar la acción de forma robusta
      const response = await fetch('/api/admin/document-review/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: document.id,
          action: action === 'request_correction' ? 'request_changes' : action,
          comment: comment.trim(),
          is_internal: isInternal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la acción')
      }

      toast.success(result.message || 'Acción completada con éxito')
      
      if (result.warning) {
        toast.warning(result.warning)
      }

      // Redirigir al listado
      router.push('/admin/document-review')
      router.refresh()
    } catch (error: any) {
      console.error('Error processing action:', error)
      toast.error(error.message || 'Error al procesar la acción')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDocumentUrl = async () => {
    const filePath = document.current_signed_file_path || document.original_file_path
    if (!filePath) return null

    const bucket = document.current_signed_file_path ? 'docs-signed' : 'docs-originals'

    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600)

    return data?.signedUrl || null
  }

  const handleRegeneratePdf = async () => {
    setIsRegenerating(true)

    try {
      const response = await fetch('/api/admin/signing/regenerate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: document.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo regenerar el PDF')
      }

      toast.success('PDF regenerado correctamente')
      router.refresh()
    } catch (error: any) {
      console.error('Error regenerando PDF:', error)
      toast.error(error.message || 'Error al regenerar el PDF')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <Tabs defaultValue="review" className="space-y-6">
      <TabsList>
        <TabsTrigger value="review">Revisión y Acciones</TabsTrigger>
        <TabsTrigger value="preview">Vista Previa del Documento</TabsTrigger>
      </TabsList>

      <TabsContent value="review">
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
                      {document.status === 'manual_review' ? 'Revisión Manual' : 
                       document.status === 'needs_correction' ? 'Necesita Corrección' : 
                       document.status}
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
                <div className="flex flex-wrap gap-2">
                  {document.original_file_path && (
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
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRegeneratePdf}
                    disabled={isRegenerating}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {isRegenerating ? 'Regenerando PDF...' : 'Regenerar PDF de firmas'}
                  </Button>
                </div>
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
      </TabsContent>

      <TabsContent value="preview" className="min-h-[800px]">
        <PDFViewer
          bucket={['docs-signed', 'docs-originals']}
          filePath={document.current_signed_file_path || document.original_file_path || ''}
          documentTitle={document.title}
          className="h-full border-0"
        />
      </TabsContent>
    </Tabs>
  )
}

