'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface ApprovalInterfaceProps {
  document: any
  currentUserReview: any // El registro de revisión del usuario actual (si existe)
  onUpdate: () => void
}

export function ApprovalInterface({ document, currentUserReview, onUpdate }: ApprovalInterfaceProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  
  const supabase = createClient()

  // Si no hay revisión asignada o ya está aprobada/rechazada, mostramos estado
  if (!currentUserReview) return null

  const isPending = currentUserReview.status === 'pending'
  const isApproved = currentUserReview.status === 'approved'
  
  // Si el documento ya no está en revisión, no mostrar acciones
  if (document.status !== 'pending_review' && !isApproved) return null

  const handleAction = async (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction)
  }

  const handleSubmit = async () => {
    if (!action) return
    setIsSubmitting(true)

    try {
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_document_review', {
          p_document_id: document.id,
          p_comment: comment
        })
        if (error) throw new Error(error.message)
        toast.success('Documento aprobado exitosamente')
      } else {
        // Rechazar (usando update directo ya que no hicimos RPC de rechazo aún)
        const { error } = await supabase
          .from('reviewers')
          .update({
            status: 'rejected',
            review_comment: comment,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', currentUserReview.id)
        
        if (error) throw new Error(error.message)
        
        // También actualizar estado del documento a rejected o draft?
        // Generalmente rechazo devuelve a draft o rejected state.
        // Vamos a actualizar a 'rejected' por ahora para ser explícitos
        await supabase
          .from('documents')
          .update({ status: 'rejected' })
          .eq('id', document.id)

        toast.warning('Documento rechazado')
      }

      onUpdate()
      setAction(null)
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar acción')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isPending) {
    return (
      <Card className={`border-l-4 ${isApproved ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="pt-6 flex items-center gap-4">
          {isApproved ? (
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          ) : (
            <XCircle className="w-8 h-8 text-red-500" />
          )}
          <div>
            <h3 className="font-semibold text-lg">
              {isApproved ? 'Has aprobado este documento' : 'Has rechazado este documento'}
            </h3>
            {currentUserReview.review_comment && (
              <p className="text-muted-foreground mt-1">"{currentUserReview.review_comment}"</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <AlertCircle className="w-6 h-6 text-blue-500" />
             <div>
               <h3 className="font-semibold text-lg">Se requiere tu revisión</h3>
               <p className="text-muted-foreground text-sm">
                 Por favor revisa el documento y aprueba o solicita cambios.
               </p>
             </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex-1 md:flex-none">
                  <XCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rechazar Documento</DialogTitle>
                  <DialogDescription>
                    Indica por qué estás rechazando este documento. Esto notificará al propietario.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Razón del rechazo</Label>
                    <Textarea 
                      placeholder="Ej: La cláusula 3.1 no es correcta..." 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setAction(null)}>Cancelar</Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => { handleAction('reject'); handleSubmit(); }}
                    disabled={isSubmitting || !comment}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Rechazo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white flex-1 md:flex-none">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
              </DialogTrigger>
               <DialogContent>
                <DialogHeader>
                  <DialogTitle>Aprobar Documento</DialogTitle>
                  <DialogDescription>
                    Confirmas que has revisado el documento y estás de acuerdo con su contenido.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Comentario (Opcional)</Label>
                    <Textarea 
                      placeholder="Ej: Todo correcto, listo para firmar." 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost">Cancelar</Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={() => { handleAction('approve'); handleSubmit(); }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirmar Aprobación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
