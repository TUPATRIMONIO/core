'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Stamp, Clock, CheckCircle, FileText, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

interface NotaryRequest {
  id: string
  organization_id: string
  service_type_id: string
  document_title: string | null
  status: string
  priority: string
  created_at: string
  service_type: {
    name: string
    slug: string
  }
  organization: {
    name: string
    email: string
  }
}

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-600' },
  assigned: { label: 'Asignado', icon: Clock, color: 'text-blue-600' },
  in_progress: { label: 'En proceso', icon: Clock, color: 'text-purple-600' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'text-green-600' },
  rejected: { label: 'Rechazado', icon: FileText, color: 'text-red-600' },
  cancelled: { label: 'Cancelado', icon: FileText, color: 'text-gray-600' },
}

export default function NotaryDashboardPage() {
  const { currentOrganization } = useAuthStore()
  const [requests, setRequests] = useState<NotaryRequest[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    in_progress: 0,
    completed_today: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization) {
      loadRequests()
    }
  }, [currentOrganization?.id])

  const loadRequests = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .schema('notary')
        .from('requests')
        .select(`
          *,
          service_type:service_types(name, slug),
          organization:organizations(name, email)
        `)
        .eq('notary_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error loading requests:', error)
        return
      }

      setRequests(data || [])

      // Calculate stats
      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))

      setStats({
        pending: data?.filter(r => r.status === 'pending').length || 0,
        in_progress: data?.filter(r => r.status === 'in_progress').length || 0,
        completed_today: data?.filter(r => 
          r.status === 'completed' && new Date(r.created_at) >= todayStart
        ).length || 0,
        total: data?.length || 0,
      })
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Notarial</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes asignadas a tu notaría
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Esperando asignación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En proceso</CardTitle>
            <Stamp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">Trabajando en ellos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados hoy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_today}</div>
            <p className="text-xs text-muted-foreground">En las últimas 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Solicitudes recientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes recientes</CardTitle>
              <CardDescription>
                Las últimas solicitudes asignadas a tu notaría
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/notary/requests">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando solicitudes...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay solicitudes recientes
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => {
                const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
                const StatusIcon = status.icon

                return (
                  <Link
                    key={request.id}
                    href={`/notary/requests/${request.id}`}
                    className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">
                          {request.document_title || 'Sin título'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.service_type.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliente: {request.organization.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {status.label}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

