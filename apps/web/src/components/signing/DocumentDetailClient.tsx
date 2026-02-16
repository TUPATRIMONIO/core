'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  Send, 
  FileCheck,
  MoreVertical,
  Loader2,
  Lock,
  Eye,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SignerEditPanel } from './edit/SignerEditPanel'
import { DocumentEditPanel } from './edit/DocumentEditPanel'
import { ReviewerManager } from './ReviewerManager'
import { ApprovalInterface } from './ApprovalInterface'
import { PDFViewer } from './PDFViewer'
import { CorrectionView } from './CorrectionView'
import { DocumentActions } from './DocumentActions'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertTriangle, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { 
  getDocumentStatusInfo, 
  getNextStepMessage,
  isDocumentEditable 
} from '@/lib/signing/document-status'

interface DocumentDetailClientProps {
  initialDocument: any
  initialSigners: any[]
  initialReviewers: any[]
  basePath?: string
}

export function DocumentDetailClient({ 
  initialDocument, 
  initialSigners, 
  initialReviewers,
  basePath = '/dashboard/signing/documents'
}: DocumentDetailClientProps) {
  const router = useRouter()
  const [document, setDocument] = useState(initialDocument)
  const [signers, setSigners] = useState(initialSigners)
  const [reviewers, setReviewers] = useState(initialReviewers)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [notaryAssignment, setNotaryAssignment] = useState<any | null>(null)
  const [aiReview, setAiReview] = useState<any | null>(null)
  const [aiReviewHistory, setAiReviewHistory] = useState<any[]>([])
  const [docMessages, setDocMessages] = useState<any[]>([])
  
  const [isSending, setIsSending] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [showAiReviewDialog, setShowAiReviewDialog] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<string[]>([])

  const supabase = createClient()

  // Cargar historial de revisiones (IA y manuales)
  const fetchAiReviews = async () => {
    if (!document?.id) return
    
    // Todas las revisiones IA
    const { data: reviews } = await supabase
      .from('signing_ai_reviews')
      .select('id, status, passed, confidence_score, reasons, risk_accepted_at, started_at, completed_at, review_type')
      .eq('document_id', document.id)
      .order('started_at', { ascending: false })
    
    // Mensajes del documento (acciones admin)
    const { data: messages } = await supabase
      .from('signing_document_messages')
      .select('id, message, is_internal, created_at, user_id')
      .eq('document_id', document.id)
      .order('created_at', { ascending: false })
    
    setAiReviewHistory(reviews || [])
    setDocMessages(messages || [])
    // Mantener el mas reciente para la tarjeta (solo si es de IA)
    setAiReview(reviews?.[0] || null)
  }

  useEffect(() => {
    // Obtener usuario actual para determinar si es revisor
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
    fetchAiReviews()
  }, [document?.id])

  const fetchNotaryAssignment = async () => {
    if (!document?.id || document.notary_service === 'none') {
      setNotaryAssignment(null)
      return
    }

    const { data } = await supabase
      .from('signing_notary_assignments')
      .select('status, notes, correction_request, rejection_reason, notarized_file_path, notary_office:signing_notary_offices(name)')
      .eq('document_id', document.id)
      .maybeSingle()

    setNotaryAssignment(data || null)
  }

  // Encontrar la revisión del usuario actual si existe
  const userReview = currentUser ? reviewers.find(r => r.user_id === currentUser.id) : null

  // Handler para refrescar datos (llamado por hijos)
  const handleRefresh = async () => {
    // Recargar todos los datos
    const { data: newSigners } = await supabase
      .from('signing_signers_ordered')
      .select('*')
      .eq('document_id', document.id)
      .order('signing_order', { ascending: true })
      
    if (newSigners) setSigners(newSigners)

    const { data: newReviewers } = await supabase
      .from('signing_reviewers')
      .select('*, user:core.users(full_name, email, avatar_url)')
      .eq('document_id', document.id)
      
    if (newReviewers) setReviewers(newReviewers)

    const { data: newDoc } = await supabase
      .from('signing_documents_full')
      .select('*')
      .eq('id', document.id)
      .single()
      
    if (newDoc) setDocument(newDoc)
    
    router.refresh()
    await fetchNotaryAssignment()
    await fetchAiReviews()
  }
  
  useEffect(() => {
    fetchNotaryAssignment()
  }, [document?.id, document?.notary_service])

  const handleSendToSign = async () => {
    try {
      setIsSending(true)
      
      // Usar la nueva API de firma que integra CDS
      const response = await fetch('/api/signing/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: document.id
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Error al iniciar proceso de firma')
      }

      toast.success(result.message || 'Proceso de firma iniciado exitosamente')
      
      // Si hay advertencias (ej: firmantes sin enrolar), mostrarlas
      if (result.signers_status) {
        const needsEnrollment = result.signers_status.filter((s: any) => !s.enrolled && !s.is_foreigner).length
        if (needsEnrollment > 0) {
          toast.info(`${needsEnrollment} firmante(s) necesitan enrolamiento FEA`)
        }
      }

      handleRefresh()
    } catch (error: any) {
      console.error('Error sending to sign:', error)
      toast.error(error.message || 'Error al enviar documento')
    } finally {
      setIsSending(false)
    }
  }

  const handleSendToReview = async () => {
    if (reviewers.length === 0) {
      toast.error('Debes agregar al menos un revisor')
      return
    }

    try {
      setIsSubmittingReview(true)
      const { error } = await supabase.rpc('submit_document_for_review', {
        p_document_id: document.id,
        p_reviewer_ids: [] // Enviamos vacío porque ya los insertamos manualmente en ReviewerManager
        // Nota: Si la RPC requiere IDs para crear rows, tendríamos que ajustar.
        // Pero como ya creamos las rows en ReviewerManager (estado 'pending'), 
        // la RPC debería solo actualizar el status del documento si ya existen revisores.
        // Revisando la RPC 20251211000003_signing_rpc_functions.sql:
        // `submit_document_for_review` hace INSERT en reviewers.
        // Si ya existen, podría fallar o duplicar si no manejamos conflicto.
        // Ajuste estratégico: Si ya agregamos revisores manualmente, solo necesitamos actualizar el estado del documento.
      })
      
      // Como insertamos manualmente, solo actualizamos el estado del documento
      const { error: updateError } = await supabase
        .from('signing_documents')
        .update({ status: 'pending_review' })
        .eq('id', document.id)

      if (updateError) throw new Error(updateError.message)

      toast.success('Documento enviado a revisión')
      handleRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar a revisión')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    )
  }

  const getTimelineEvents = () => {
    const events = [
      ...(aiReviewHistory || []).map(review => ({
        type: 'ai_review',
        date: new Date(review.completed_at || review.started_at),
        data: review
      })),
      ...(docMessages || []).map(msg => ({
        type: 'message',
        date: new Date(msg.created_at),
        data: msg
      }))
    ]
    
    return events.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const canEdit = isDocumentEditable(document.status)
  const showNotaryTracking = document.notary_service !== 'none'
  const statusInfo = getDocumentStatusInfo(document.status)
  const nextStepMessage = getNextStepMessage(document.status, document.notary_service)
  const timelineEvents = getTimelineEvents()
  const hasHistory = timelineEvents.length > 0

  return (
    <div className="space-y-6">
      {/* Vista de corrección si el documento necesita correcciones */}
      {document.status === 'needs_correction' && (
        <CorrectionView 
          documentId={document.id}
          onCorrectionUploaded={handleRefresh}
        />
      )}

      {/* Interface de Aprobación para Revisores */}
      <ApprovalInterface 
        document={document} 
        currentUserReview={userReview} 
        onUpdate={handleRefresh} 
      />

      <div className="flex flex-col gap-4">
        {/* Header con acciones */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      className={`${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass} hover:opacity-90 cursor-help`}
                    >
                      {statusInfo.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{statusInfo.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              ID: <span className="font-mono">{document.qr_identifier || document.id}</span>
              {' • '}
              Creado el {format(new Date(document.created_at), "d MMM yyyy", { locale: es })}
            </p>
            {nextStepMessage && (
              <p className="text-sm text-[var(--tp-buttons)] flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                {nextStepMessage}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {document.status === 'draft' && (
              <>
                 {document.requires_approval ? (
                    <Button onClick={handleSendToReview} disabled={isSubmittingReview || reviewers.length === 0} variant="secondary">
                      {isSubmittingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                      Enviar a Revisión
                    </Button>
                 ) : (
                    <Button onClick={handleSendToSign} disabled={isSending || signers.length === 0}>
                      {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Enviar a Firma
                    </Button>
                 )}
              </>
            )}
            
            {document.status === 'approved' && (
               <Button onClick={handleSendToSign} disabled={isSending || signers.length === 0} className="bg-green-600 hover:bg-green-700">
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Enviar a Firma (Aprobado)
                </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.print()}>
                  Imprimir detalles
                </DropdownMenuItem>
                {/* Más acciones aquí */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Botones para ver documentos */}
        <DocumentActions
          originalFilePath={document.original_file_path}
          signedFilePath={document.current_signed_file_path}
          notarizedFilePath={notaryAssignment?.notarized_file_path}
        />

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Firmantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {document.signed_count} / {document.signers_count}
              </div>
              <p className="text-xs text-muted-foreground">
                {document.signing_order === 'sequential' ? 'Orden Secuencial' : 'Firma Simultánea'}
              </p>
            </CardContent>
          </Card>
          
          <Card 
            className={hasHistory ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}
            onClick={() => hasHistory && setShowAiReviewDialog(true)}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisión</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {!document.requires_ai_review && !hasHistory ? (
                  <span className="text-muted-foreground">-</span>
                ) : !hasHistory ? (
                  <span className="text-muted-foreground">Pendiente</span>
                ) : aiReview?.passed ? (
                  <span className="text-green-600">Aprobado</span>
                ) : aiReview?.risk_accepted_at ? (
                  <span className="text-blue-600">Aceptado</span>
                ) : aiReview?.status === 'needs_changes' ? (
                  <span className="text-orange-600">Observado</span>
                ) : aiReview?.status === 'rejected' ? (
                  <span className="text-red-600">Rechazado</span>
                ) : aiReview ? (
                  <span className="text-yellow-600">En proceso</span>
                ) : (
                  // Si no hay aiReview pero hay historial (ej: mensajes manuales), mostramos el estado general del documento
                  <span className={statusInfo.textClass}>{statusInfo.label}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {!document.requires_ai_review && !hasHistory
                  ? 'No requerida' 
                  : hasHistory
                    ? `${timelineEvents.length} revisión(es) - Click para ver`
                    : 'Requerida'
                }
              </p>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprobación</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="text-2xl font-bold">
                {reviewers.filter(r => r.status === 'approved').length} / {reviewers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                 {document.requires_approval ? 'Requerida' : 'No requerida'}
              </p>
            </CardContent>
          </Card>

           <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notaría</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {document.notary_service === 'none' ? 'No' : 'Sí'}
              </div>
              <p className="text-xs text-muted-foreground">
                 {document.notary_service === 'none' ? 'Solo firma electrónica' : document.notary_service}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showNotaryTracking && (
        <Card>
          <CardHeader>
            <CardTitle>Seguimiento del pedido</CardTitle>
            <CardDescription>Estado general de tu solicitud de firma y notarización.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estado actual destacado */}
            <div className="rounded-lg border border-[var(--tp-lines-30)] bg-gradient-to-r from-[var(--tp-bg-light-10)] to-transparent p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Estado actual</div>
                  <Badge 
                    className={`${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass} text-sm px-3 py-1`}
                  >
                    {statusInfo.label}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Notaría asignada</div>
                  <div className="text-sm font-semibold">
                    {notaryAssignment?.notary_office?.name || 'Asignación en curso'}
                  </div>
                </div>
              </div>
            </div>

            {(document.status === 'notary_observed' || document.status === 'notary_rejected') && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                Tu documento está siendo revisado por nuestro equipo. Te contactaremos si hace falta algo.
              </div>
            )}

            {/* Timeline del proceso */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progreso del pedido</div>
              <div className="grid gap-2">
                {/* Paso 1: Firmas */}
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${
                    ['pending_signature', 'partially_signed'].includes(document.status) 
                      ? 'bg-yellow-500 animate-pulse' 
                      : ['signed', 'pending_notary', 'notary_observed', 'notarized', 'completed'].includes(document.status)
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    ['signed', 'pending_notary', 'notary_observed', 'notarized', 'completed'].includes(document.status)
                      ? 'font-medium text-green-700'
                      : ['pending_signature', 'partially_signed'].includes(document.status)
                        ? 'font-medium'
                        : 'text-muted-foreground'
                  }`}>
                    Firma electrónica ({document.signed_count}/{document.signers_count} firmantes)
                  </span>
                </div>
                
                {/* Paso 2: Enviado a notaría */}
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${
                    document.status === 'pending_notary' 
                      ? 'bg-purple-500 animate-pulse' 
                      : ['notary_observed', 'notarized', 'completed'].includes(document.status)
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    ['notary_observed', 'notarized', 'completed'].includes(document.status)
                      ? 'font-medium text-green-700'
                      : document.status === 'pending_notary'
                        ? 'font-medium'
                        : 'text-muted-foreground'
                  }`}>
                    Enviado a notaría
                  </span>
                </div>
                
                {/* Paso 3 (opcional): En revisión */}
                {document.status === 'notary_observed' && (
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-sm font-medium text-orange-700">
                      En revisión interna
                    </span>
                  </div>
                )}
                
                {/* Paso 4: Notariado */}
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${
                    ['notarized', 'completed'].includes(document.status) 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    ['notarized', 'completed'].includes(document.status)
                      ? 'font-medium text-green-700'
                      : 'text-muted-foreground'
                  }`}>
                    Documento notariado
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="signers" className="w-full">
        <TabsList>
          <TabsTrigger value="signers">Firmantes</TabsTrigger>
          <TabsTrigger value="reviewers">Revisores</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signers" className="space-y-4">
          <SignerEditPanel 
            documentId={document.id}
            canEdit={canEdit}
            onUpdate={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-4">
          <ReviewerManager 
            document={document} 
            reviewers={reviewers} 
            onUpdate={handleRefresh}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <DocumentEditPanel document={document} onUpdate={handleRefresh} />
          <PDFViewer
            bucket={['docs-originals', 'docs-signed']}
            filePath={document.current_signed_file_path || document.original_file_path}
            documentTitle={document.title}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Eventos</CardTitle>
              <CardDescription>Registro de auditoría del documento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                Próximamente: Historial detallado de cambios
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Historial de Revisiones */}
      <Dialog open={showAiReviewDialog} onOpenChange={setShowAiReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Historial de Revisiones
            </DialogTitle>
            <DialogDescription>
              Registro de todas las revisiones realizadas al documento
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 p-6 pt-2">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {timelineEvents.map((event, index) => {
                if (event.type === 'ai_review') {
                  const review = event.data
                  const isExpanded = expandedReviews.includes(review.id)
                  
                  return (
                    <div key={`review-${review.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icono central */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        {review.passed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : review.risk_accepted_at ? (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        ) : review.status === 'needs_changes' ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ) : review.status === 'rejected' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      
                      {/* Contenido */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-slate-900">Revisión Automática</div>
                          <time className="font-caveat font-medium text-amber-500 text-xs">
                            {format(event.date, "d MMM, HH:mm", { locale: es })}
                          </time>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={review.passed ? "default" : "outline"} className={
                            review.passed ? "bg-green-500 hover:bg-green-600" :
                            review.risk_accepted_at ? "text-blue-600 border-blue-200 bg-blue-50" :
                            review.status === 'needs_changes' ? "text-orange-600 border-orange-200 bg-orange-50" :
                            review.status === 'rejected' ? "text-red-600 border-red-200 bg-red-50" :
                            "text-yellow-600 border-yellow-200 bg-yellow-50"
                          }>
                            {review.passed ? 'Aprobado' : 
                             review.risk_accepted_at ? 'Riesgo Aceptado' :
                             review.status === 'needs_changes' ? 'Observado' :
                             review.status === 'rejected' ? 'Rechazado' : 'En Proceso'}
                          </Badge>
                          {review.confidence_score && (
                            <span className="text-xs text-muted-foreground">
                              Confianza: {(parseFloat(review.confidence_score) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>

                        {review.reasons && review.reasons.length > 0 && (
                          <div className="mt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-between h-8 text-xs"
                              onClick={() => toggleReviewExpansion(review.id)}
                            >
                              <span>{review.reasons.length} observación(es)</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                            
                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {review.reasons.map((reason: any, idx: number) => (
                                  <div key={idx} className="text-xs p-2 bg-slate-50 rounded border border-slate-100">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${
                                        reason.level === 'high' || reason.level === 'critical' ? 'bg-red-500' :
                                        reason.level === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                      }`} />
                                      <span className="font-medium text-slate-700">
                                        {reason.level === 'high' || reason.level === 'critical' ? 'Alto' :
                                         reason.level === 'medium' ? 'Medio' : 'Bajo'}
                                      </span>
                                    </div>
                                    <p className="text-slate-600">{reason.text || reason.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                } else {
                  const msg = event.data
                  return (
                    <div key={`msg-${msg.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Icono central */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      </div>
                      
                      {/* Contenido */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-slate-900">Acción del Equipo</div>
                          <time className="font-caveat font-medium text-amber-500 text-xs">
                            {format(event.date, "d MMM, HH:mm", { locale: es })}
                          </time>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {msg.message}
                        </p>
                        {msg.is_internal && (
                          <Badge variant="outline" className="mt-2 text-[10px] h-5">Interno</Badge>
                        )}
                      </div>
                    </div>
                  )
                }
              })}

              {timelineEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de revisiones disponible
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
