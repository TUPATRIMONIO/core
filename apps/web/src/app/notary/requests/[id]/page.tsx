'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function NotaryRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization } = useAuthStore()

  const requestId = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (currentOrganization && requestId) {
      loadRequest()
    }
  }, [currentOrganization?.id, requestId])

  const loadRequest = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .schema('notary')
        .from('requests')
        .select(`
          *,
          service_type:service_types(name, slug, description),
          organization:organizations(name, email, phone),
          events:request_events(*)
        `)
        .eq('id', requestId)
        .eq('notary_id', currentOrganization.id)
        .single()

      if (error || !data) {
        throw new Error('Solicitud no encontrada')
      }

      setRequest(data)
      setNotes(data.notes || '')
    } catch (error) {
      console.error('Error loading request:', error)
      toast({
        title: 'Error',
        description: 'No se pudo cargar la solicitud',
        variant: 'destructive',
      })
      router.push('/notary/requests')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('notary')
        .from('requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Solicitud aceptada',
        description: 'Ahora puedes procesar esta solicitud',
      })

      loadRequest()
    } catch (error) {
      console.error('Error accepting request:', error)
      toast({
        title: 'Error',
        description: 'No se pudo aceptar la solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComplete = async () => {
    if (!resultFile) {
      toast({
        title: 'Error',
        description: 'Debes subir el documento procesado',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClient()

      // Upload result file
      const fileName = `notary/${currentOrganization!.id}/${requestId}/${resultFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('notary-documents')
        .upload(fileName, resultFile)

      if (uploadError) {
        throw new Error('Error al subir el archivo')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('notary-documents')
        .getPublicUrl(fileName)

      // Update request
      const { error } = await supabase
        .schema('notary')
        .from('requests')
        .update({
          status: 'completed',
          result_url: publicUrl,
          completed_at: new Date().toISOString(),
          notes: notes,
        })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Solicitud completada',
        description: 'El documento procesado se ha guardado correctamente',
      })

      router.push('/notary/requests')
    } catch (error) {
      console.error('Error completing request:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al completar la solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud?')) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('notary')
        .from('requests')
        .update({
          status: 'rejected',
          notes: notes,
        })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Solicitud rechazada',
        description: 'El cliente será notificado',
      })

      router.push('/notary/requests')
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: 'Error',
        description: 'No se pudo rechazar la solicitud',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando solicitud...
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Solicitud no encontrada</p>
        <Button asChild>
          <Link href="/notary/requests">Volver a solicitudes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notary/requests">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {request.document_title || 'Sin título'}
            </h1>
            <p className="text-muted-foreground">{request.service_type.name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cliente</label>
              <p className="mt-1">{request.organization.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{request.organization.email}</p>
            </div>
            {request.organization.phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                <p className="mt-1">{request.organization.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
              <p className="mt-1 capitalize">{request.priority}</p>
            </div>
          </CardContent>
        </Card>

        {/* Service info */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Servicio</label>
              <p className="mt-1">{request.service_type.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado</label>
              <p className="mt-1 capitalize">{request.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Solicitud creada</label>
              <p className="mt-1">
                {new Date(request.created_at).toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document */}
      {request.document_url && (
        <Card>
          <CardHeader>
            <CardTitle>Documento original</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => window.open(request.document_url, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar documento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing */}
      {request.status === 'in_progress' && (
        <Card>
          <CardHeader>
            <CardTitle>Procesar solicitud</CardTitle>
            <CardDescription>
              Sube el documento procesado y completa la solicitud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento procesado</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                {resultFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{resultFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResultFile(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Haz clic para subir el documento firmado
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResultFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre el procesamiento..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                disabled={isProcessing || !resultFile}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isProcessing ? 'Procesando...' : 'Marcar como completado'}
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accept button */}
      {request.status === 'pending' && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Button onClick={handleAccept} disabled={isProcessing} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                {isProcessing ? 'Procesando...' : 'Aceptar solicitud'}
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {request.result_url && (
        <Card>
          <CardHeader>
            <CardTitle>Documento procesado</CardTitle>
            <CardDescription>
              Documento firmado y procesado por la notaría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => window.open(request.result_url, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar documento procesado
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

