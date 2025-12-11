'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  FileText, 
  Users, 
  History, 
  Send, 
  FileCheck,
  Download,
  MoreVertical,
  Loader2,
  Lock,
  Eye,
  CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SignerManager } from './SignerManager'
import { ReviewerManager } from './ReviewerManager'
import { ApprovalInterface } from './ApprovalInterface'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DocumentDetailClientProps {
  initialDocument: any
  initialSigners: any[]
  initialReviewers: any[]
}

export function DocumentDetailClient({ 
  initialDocument, 
  initialSigners, 
  initialReviewers 
}: DocumentDetailClientProps) {
  const router = useRouter()
  const [document, setDocument] = useState(initialDocument)
  const [signers, setSigners] = useState(initialSigners)
  const [reviewers, setReviewers] = useState(initialReviewers)
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [isSending, setIsSending] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Obtener usuario actual para determinar si es revisor
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [])

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
  }

  const handleSendToSign = async () => {
    try {
      setIsSending(true)
      const { data, error } = await supabase.rpc('send_document_to_sign', {
        p_document_id: document.id
      })

      if (error) throw new Error(error.message)

      toast.success('Documento enviado a firma exitosamente')
      handleRefresh()
    } catch (error: any) {
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
        .from('documents')
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

  return (
    <div className="space-y-6">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
              <Badge variant="outline">{document.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ID: <span className="font-mono">{document.qr_identifier || document.id}</span>
              {' • '}
              Creado el {format(new Date(document.created_at), "d MMM yyyy", { locale: es })}
            </p>
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
          
          <Card>
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisión AI</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {/* TODO: Mostrar status de IA */} ?
              </div>
              <p className="text-xs text-muted-foreground">
                {document.requires_ai_review ? 'Requerida' : 'No requerida'}
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

      <Tabs defaultValue="signers" className="w-full">
        <TabsList>
          <TabsTrigger value="signers">Firmantes</TabsTrigger>
          <TabsTrigger value="reviewers">Revisores</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="signers" className="space-y-4">
          <SignerManager 
            document={document} 
            signers={signers} 
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
        
        <TabsContent value="preview">
          <Card>
             <CardContent className="p-0 overflow-hidden min-h-[500px] flex items-center justify-center bg-gray-100">
               {/* Aquí idealmente iría un visor PDF */}
               <div className="text-center">
                 <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                 <p className="text-gray-500">Vista previa del PDF</p>
                 <Button variant="link" onClick={() => window.open(document.current_signed_file_path || document.original_file_path, '_blank')}>
                   Abrir archivo original
                 </Button>
               </div>
             </CardContent>
          </Card>
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
    </div>
  )
}
