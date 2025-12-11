'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Loader2, 
  FileSignature, 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SigningData {
  document_id: string
  document_title: string
  document_description: string | null
  original_file_path: string // Ojo: RPC debe devolver URL prefirmada o path público si es posible
  current_file_path: string | null
  signer_id: string
  signer_name: string
  signer_email: string
  signer_status: string // 'pending', 'signed', 'rejected'
  organization_name: string
  requires_location: boolean
  is_my_turn: boolean
}

interface PublicSigningClientProps {
  signingData: SigningData
  token: string
}

export function PublicSigningClient({ signingData, token }: PublicSigningClientProps) {
  const [isAgreed, setIsAgreed] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isComplete, setIsComplete] = useState(signingData.signer_status === 'signed')
  const [statusMessage, setStatusMessage] = useState('')
  
  // Estado para rechazo
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const supabase = createClient()

  const handleSign = async () => {
    if (!isAgreed) return

    try {
      setIsSigning(true)
      
      // Obtener IP y User Agent (básico)
      const userAgent = window.navigator.userAgent
      // IP se obtiene mejor del lado del servidor o Edge Function, 
      // pero pasaremos metadatos básicos que el cliente tiene.
      
      const { data, error } = await supabase.rpc('record_signature', {
        p_token: token,
        p_ip_address: '0.0.0.0', // Placeholder, idealmente obtener en Edge Function
        p_user_agent: userAgent,
        p_location: null // Opcional: pedir geolocalización
      })

      if (error) throw new Error(error.message)

      setIsComplete(true)
      setStatusMessage('¡Documento firmado exitosamente!')
      toast.success('Documento firmado correctamente')

    } catch (error: any) {
      console.error('Error signing:', error)
      toast.error(error.message || 'Error al firmar el documento')
    } finally {
      setIsSigning(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error('Debes indicar una razón para rechazar')
      return
    }

    try {
      setIsRejecting(true)
      
      const { data, error } = await supabase.rpc('reject_signature', {
        p_token: token,
        p_reason: rejectReason,
        p_ip_address: '0.0.0.0', 
        p_user_agent: window.navigator.userAgent
      })

      if (error) throw new Error(error.message)

      setIsComplete(true) // "Complete" en sentido de que terminó su acción
      setStatusMessage('Has rechazado el documento.')
      toast.info('Documento rechazado')

    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar')
    } finally {
      setIsRejecting(false)
    }
  }

  // Vista de Éxito / Finalizado
  if (isComplete) {
    const isSigned = statusMessage.includes('firmado') || signingData.signer_status === 'signed'
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-t-4 border-t-green-600">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              {isSigned ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {isSigned ? '¡Documento Firmado!' : 'Documento Rechazado'}
            </h2>
            
            <p className="text-gray-600">
              {isSigned 
                ? 'Gracias por completar el proceso de firma electrónica. Recibirás una copia cuando todos hayan firmado.' 
                : 'Has rechazado firmar este documento. El solicitante ha sido notificado.'}
            </p>

            <Separator className="my-6" />

            <div className="text-sm text-gray-500">
              <p>Documento: <span className="font-medium text-gray-900">{signingData.document_title}</span></p>
              <p className="mt-1">ID: {signingData.document_id.slice(0, 8)}</p>
            </div>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button variant="outline" onClick={() => window.close()}>
              Cerrar pestaña
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Validaciones previas de turno
  if (!signingData.is_my_turn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Aún no es tu turno</CardTitle>
            <CardDescription>
              Este documento debe ser firmado por otras personas antes que tú.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Recibirás un correo electrónico cuando sea tu momento de firmar.
            <br />
            Por favor, espera pacientemente.
          </CardContent>
        </Card>
      </div>
    )
  }

  // Vista Principal de Firma
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <ShieldCheck className="w-8 h-8 text-[var(--tp-brand)]" />
          Firma Segura
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Solicitado por <span className="font-semibold">{signingData.organization_name}</span>
        </p>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna Izquierda: Documento */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex justify-between items-center">
                 <span>{signingData.document_title}</span>
                 {/* TODO: Add download button logic */}
                 <Button variant="ghost" size="sm">
                   <Download className="w-4 h-4 mr-2" />
                   Descargar
                 </Button>
              </CardTitle>
              {signingData.document_description && (
                <CardDescription>{signingData.document_description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex-1 bg-gray-100 p-0 overflow-hidden relative">
              {/* PDF Preview Placeholder */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                 <FileSignature className="w-16 h-16 mb-4 opacity-50" />
                 <p>Vista previa del documento</p>
                 <Button 
                   variant="link" 
                   // En producción, usar URL firmada de Storage
                   onClick={() => alert('En producción esto abriría el visualizador PDF')}
                 >
                   Ver documento completo
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Acciones */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Tus Datos</CardTitle>
              <CardDescription>
                Verifica que la información sea correcta antes de firmar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{signingData.signer_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{signingData.signer_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">{format(new Date(), "d MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-[var(--tp-brand)]/20">
            <CardHeader>
              <CardTitle>Firmar Documento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showRejectInput ? (
                <>
                  <div className="flex items-start space-x-3 p-4 bg-muted/30 rounded-lg border">
                    <Checkbox 
                      id="terms" 
                      checked={isAgreed} 
                      onCheckedChange={(c) => setIsAgreed(c as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Acepto firmar electrónicamente este documento
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Entiendo que mi firma electrónica tiene la misma validez legal que mi firma manuscrita.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      size="lg" 
                      className="w-full bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)] text-lg h-12"
                      onClick={handleSign}
                      disabled={!isAgreed || isSigning}
                    >
                      {isSigning ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <FileSignature className="w-5 h-5 mr-2" />
                          Firmar Documento
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setShowRejectInput(true)}
                    >
                      No deseo firmar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <Label className="text-red-600 font-semibold">Rechazar Documento</Label>
                    <p className="text-sm text-muted-foreground">
                      Por favor indica la razón por la cual rechazas firmar este documento.
                    </p>
                    <Input 
                      placeholder="Razón del rechazo..." 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      onClick={() => setShowRejectInput(false)}
                      disabled={isRejecting}
                    >
                      Volver
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={handleReject}
                      disabled={isRejecting || !rejectReason}
                    >
                      {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Rechazo'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
