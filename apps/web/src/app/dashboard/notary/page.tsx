'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Stamp, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { NotaryRequest } from '@/types/database'

const statusConfig = {
  pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-600' },
  assigned: { label: 'Asignado', icon: Clock, color: 'text-blue-600' },
  in_progress: { label: 'En proceso', icon: Clock, color: 'text-blue-600' },
  completed: { label: 'Completado', icon: CheckCircle, color: 'text-green-600' },
  cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-gray-600' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'text-red-600' },
}

export default function NotaryPage() {
  const { currentOrganization } = useAuthStore()
  const [requests, setRequests] = useState<NotaryRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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
      const { data } = await supabase
        .schema('notary')
        .from('requests')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })

      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRequests = requests.filter(req =>
    req.document_title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicios Notariales</h1>
          <p className="text-muted-foreground">
            Gestiona tus solicitudes de servicios notariales
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notary/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva solicitud
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
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
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? 'No se encontraron solicitudes con ese término'
                : 'Comienza creando tu primera solicitud'}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/dashboard/notary/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva solicitud
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status]
            const StatusIcon = status.icon

            return (
              <Card key={request.id} className="hover:bg-muted/50 transition-colors">
                <Link href={`/dashboard/notary/${request.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {request.document_title || 'Sin título'}
                        </CardTitle>
                        {request.notes && (
                          <CardDescription className="line-clamp-1">
                            {request.notes}
                          </CardDescription>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Creado: {new Date(request.created_at).toLocaleDateString('es-CL')}
                      </span>
                      <span className="capitalize">
                        Prioridad: {request.priority}
                      </span>
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
