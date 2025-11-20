'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Filter, Clock, CheckCircle, FileText } from 'lucide-react'
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

export default function NotaryRequestsPage() {
  const { currentOrganization } = useAuthStore()
  const [requests, setRequests] = useState<NotaryRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

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
      let query = supabase
        .schema('notary')
        .from('requests')
        .select(`
          *,
          service_type:service_types(name, slug),
          organization:organizations(name, email)
        `)
        .eq('notary_id', currentOrganization.id)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading requests:', error)
        return
      }

      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRequests = requests.filter(req =>
    (req.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solicitudes</h1>
        <p className="text-muted-foreground">
          Todas las solicitudes asignadas a tu notaría
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="assigned">Asignado</option>
          <option value="in_progress">En proceso</option>
          <option value="completed">Completado</option>
        </select>
      </div>

      {/* Requests list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando solicitudes...
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stamp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay solicitudes</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron solicitudes con esos filtros'
                : 'Aún no tienes solicitudes asignadas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending
            const StatusIcon = status.icon

            return (
              <Card key={request.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/notary/requests/${request.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">
                          {request.document_title || 'Sin título'}
                        </CardTitle>
                        <CardDescription>
                          {request.service_type.name}
                        </CardDescription>
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Cliente: {request.organization.name}</span>
                      <span>•</span>
                      <span>
                        {new Date(request.created_at).toLocaleDateString('es-CL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">Prioridad: {request.priority}</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

