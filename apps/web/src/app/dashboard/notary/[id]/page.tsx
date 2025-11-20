'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, CheckCircle, XCircle, FileText, Stamp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-600' },
  assigned: { label: 'Asignado', icon: Clock, color: 'text-blue-600' },
  in_progress: { label: 'En proceso', icon: Clock, color: 'text-purple-600' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'text-red-600' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-gray-600' },
}

export default function NotaryRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrganization } = useAuthStore()

  const requestId = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

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

      // Load request
      const { data: requestData, error: requestError } = await supabase
        .schema('notary')
        .from('requests')
        .select(`
          *,
          service_type:service_types(name, slug, description, base_price),
          notary:notaries(name, email, city, region)
        `)
        .eq('id', requestId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (requestError || !requestData) {
        throw new Error('Solicitud no encontrada')
      }

      setRequest(requestData)

      // Load events
      const { data: eventsData } = await supabase
        .schema('notary')
        .from('request_events')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading request:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar la solicitud',
        variant: 'destructive',
      })
      router.push('/dashboard/notary')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return

    setIsProcessing(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('notary')
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: 'Solicitud cancelada',
        description: 'La solicitud ha sido cancelada',
      })

      loadRequest()
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast({
        title: 'Error',
        description: 'Error al cancelar la solicitud',
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
          <Link href="/dashboard/notary">Volver a solicitudes</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  const canCancel = ['pending', 'assigned'].includes(request.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/notary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {request.document_title || 'Sin título'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className={`text-sm ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {request.document_url && (
            <Button
              variant="outline"
              onClick={() => window.open(request.document_url, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Documento original
            </Button>
          )}
          {request.result_url && (
            <Button
              onClick={() => window.open(request.result_url, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Documento procesado
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancel} disabled={isProcessing}>
              Cancelar solicitud
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Service info */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Servicio</label>
                <p className="mt-1">{request.service_type.name}</p>
              </div>
              {request.service_type.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                  <p className="mt-1 text-sm">{request.service_type.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
                  <p className="mt-1 capitalize">{request.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creado</label>
                  <p className="mt-1">
                    {new Date(request.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              {request.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notas</label>
                  <p className="mt-1 text-sm">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notary info */}
          <Card>
            <CardHeader>
              <CardTitle>Notaría asignada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="mt-1">{request.notary.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ubicación</label>
                <p className="mt-1">{request.notary.city}, {request.notary.region}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contacto</label>
                <p className="mt-1">{request.notary.email}</p>
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
              <CardDescription>Eventos de la solicitud</CardDescription>
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

