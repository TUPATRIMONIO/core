'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Download,
  X,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import type { SignatureDocument, DocumentSigner } from '@/types/database'

interface DocumentEvent {
  id: string
  document_id: string
  event_type: string
  description: string
  metadata: Record<string, any>
  created_at: string
}

const statusConfig = {
  draft: { label: 'Borrador', icon: FileText, color: 'text-muted-foreground' },
  pending_signatures: { label: 'Pendiente de firmas', icon: Clock, color: 'text-yellow-600' },
  partially_signed: { label: 'Parcialmente firmado', icon: Clock, color: 'text-blue-600' },
  fully_signed: { label: 'Totalmente firmado', icon: CheckCircle, color: 'text-green-600' },
  pending_notary: { label: 'Pendiente notaría', icon: Clock, color: 'text-orange-600' },
  notary_processing: { label: 'Notaría procesando', icon: Clock, color: 'text-blue-600' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'text-red-600' },
  expired: { label: 'Expirado', icon: XCircle, color: 'text-gray-600' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-gray-600' },
}

const signerStatusConfig = {
  pending: { label: 'Pendiente', color: 'text-yellow-600' },
  notified: { label: 'Notificado', color: 'text-blue-600' },
  viewed: { label: 'Visto', color: 'text-purple-600' },
  signed: { label: 'Firmado', color: 'text-green-600' },
  rejected: { label: 'Rechazado', color: 'text-red-600' },
  expired: { label: 'Expirado', color: 'text-gray-600' },
}

export default function SignatureDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization, user } = useAuthStore()

  const documentId = params.id as string

  const [document, setDocument] = useState<SignatureDocument | null>(null)
  const [signers, setSigners] = useState<DocumentSigner[]>([])
  const [events, setEvents] = useState<DocumentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (currentOrganization && documentId) {
      loadDocument()
    }
  }, [currentOrganization?.id, documentId])

  const loadDocument = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Load document
      const { data: docData, error: docError } = await supabase
        .schema('signatures')
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (docError || !docData) {
        throw new Error('Documento no encontrado')
      }

      setDocument(docData)

      // Load signers
      const { data: signersData } = await supabase
        .schema('signatures')
        .from('document_signers')
        .select('*')
        .eq('document_id', documentId)
        .order('signing_order')

      setSigners(signersData || [])

      // Load events
      const { data: eventsData } = await supabase
        .schema('signatures')
        .from('document_events')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading document:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar el documento',
        variant: 'destructive',
      })
      router.push('/dashboard/signatures')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendReminder = async (signerId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/signatures/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, signerId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar recordatorio')
      }

      toast({
        title: 'Recordatorio enviado',
        description: 'Se ha enviado un recordatorio al firmante',
      })

      loadDocument()
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar recordatorio',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelDocument = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar este documento?')) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('signatures')
        .from('documents')
        .update({ status: 'cancelled' })
        .eq('id', documentId)

      if (error) throw error

      toast({
        title: 'Documento cancelado',
        description: 'El documento ha sido cancelado',
      })

      loadDocument()
    } catch (error) {
      console.error('Error cancelling document:', error)
      toast({
        title: 'Error',
        description: 'Error al cancelar el documento',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando documento...
      </div>
    )
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Documento no encontrado</p>
        <Button asChild>
          <Link href="/dashboard/signatures">Volver a documentos</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[document.status] || statusConfig.draft
  const StatusIcon = status.icon

  const canCancel = ['draft', 'pending_signatures', 'partially_signed'].includes(document.status)
  const canSendReminders = ['pending_signatures', 'partially_signed'].includes(document.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/signatures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className={`text-sm ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {document.file_url && (
            <Button
              variant="outline"
              onClick={() => handleDownload(document.file_url, `${document.title}.pdf`)}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar original
            </Button>
          )}
          {document.signed_file_url && (
            <Button
              variant="outline"
              onClick={() => handleDownload(document.signed_file_url!, `${document.title}_firmado.pdf`)}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar firmado
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancelDocument} disabled={isProcessing}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Document info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                <p className="mt-1">{document.description || 'Sin descripción'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modo de firma</label>
                  <p className="mt-1 capitalize">
                    {document.signing_mode === 'parallel' ? 'Paralelo' : 'Secuencial'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="mt-1">
                    {new Date(document.created_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {document.expires_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expira</label>
                  <p className="mt-1">
                    {new Date(document.expires_at).toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signers */}
          <Card>
            <CardHeader>
              <CardTitle>Firmantes</CardTitle>
              <CardDescription>
                {signers.length} firmante{signers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signers.map((signer, index) => {
                  const signerStatus = signerStatusConfig[signer.status] || signerStatusConfig.pending
                  return (
                    <div
                      key={signer.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{signer.name}</p>
                            {document.signing_mode === 'sequential' && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                Orden: {signer.signing_order}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{signer.email}</span>
                            </div>
                            {signer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{signer.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Rol:</span>
                              <span>{signer.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-medium ${signerStatus.color}`}>
                          {signerStatus.label}
                        </span>
                        {canSendReminders && signer.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(signer.id)}
                            disabled={isProcessing}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Recordatorio
                          </Button>
                        )}
                        {signer.signed_at && (
                          <span className="text-xs text-muted-foreground">
                            Firmado: {new Date(signer.signed_at).toLocaleDateString('es-CL')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
              <CardDescription>Eventos del documento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay eventos
                  </p>
                ) : (
                  events.map((event, index) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {index < events.length - 1 && (
                          <div className="w-px h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.created_at).toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

