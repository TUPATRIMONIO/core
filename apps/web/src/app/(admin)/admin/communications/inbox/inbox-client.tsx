'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Mail, Clock, User, ArrowRight, Filter, ChevronDown, ChevronUp, Search, X, Trash2 } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Switch } from '@/components/ui/switch'

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  contact: {
    id: string
    email: string
    full_name: string | null
  } | null
  assigned_user: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
}

export function InboxClient() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [autoSync, setAutoSync] = useState(false) // Desactivado por defecto
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false)
  
  // Filtros avanzados
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [fromEmail, setFromEmail] = useState<string>('')
  const [toEmail, setToEmail] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [bodyText, setBodyText] = useState<string>('')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (unreadOnly) params.append('unread_only', 'true')
      
      // Filtros avanzados
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (fromEmail) params.append('from_email', fromEmail)
      if (toEmail) params.append('to_email', toEmail)
      if (subject) params.append('subject', subject)
      if (bodyText) params.append('body_text', bodyText)

      const response = await fetch(`/api/admin/tickets?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setTickets(data.tickets || [])
      } else {
        console.error('Error obteniendo tickets:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setFromEmail('')
    setToEmail('')
    setSubject('')
    setBodyText('')
  }
  
  const hasActiveFilters = dateFrom || dateTo || fromEmail || toEmail || subject || bodyText

  const syncEmails = async (silent: boolean = false) => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/gmail/sync', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        setLastSyncTime(new Date())
        if (!silent) {
          alert(`Sincronización completada: ${data.message}`)
        }
        fetchTickets()
      } else {
        if (!silent) {
          alert(`Error sincronizando: ${data.error}`)
        }
      }
    } catch (error: any) {
      if (!silent) {
        alert(`Error: ${error.message}`)
      }
    } finally {
      setSyncing(false)
    }
  }

  const cleanupDuplicates = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar tickets duplicados? Esta acción consolidará tickets duplicados y eliminará los extras.')) {
      return
    }

    setCleaningDuplicates(true)
    try {
      const response = await fetch('/api/admin/tickets/cleanup-duplicates', {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        alert(`Limpieza completada: ${data.message}\n\nDetalles:\n- Duplicados encontrados: ${data.results.duplicatesFound}\n- Tickets consolidados: ${data.results.ticketsMerged}\n- Tickets eliminados: ${data.results.ticketsDeleted}\n- Emails movidos: ${data.results.emailsMoved}\n- Actividades movidas: ${data.results.activitiesMoved}`)
        fetchTickets()
      } else {
        alert(`Error limpiando duplicados: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setCleaningDuplicates(false)
    }
  }

  // Ejecutar filtros cuando cambien los filtros avanzados
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTickets()
    }, 500) // Debounce de 500ms

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, fromEmail, toEmail, subject, bodyText, statusFilter, priorityFilter, unreadOnly])

  // Auto-sync cada 2 minutos cuando está activado
  useEffect(() => {
    if (!autoSync) return

    const syncInterval = setInterval(() => {
      console.log('🔄 Auto-sincronizando emails...')
      syncEmails(true) // Silent sync - fetchTickets se llama dentro de syncEmails y respetará los filtros actuales
    }, 2 * 60 * 1000) // 2 minutos

    return () => clearInterval(syncInterval)
  }, [autoSync])

  // Sincronizar al cargar la página
  useEffect(() => {
    syncEmails(true)
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter, unreadOnly, dateFrom, dateTo, fromEmail, toEmail, subject, bodyText])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
      case 'open':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700'
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
      case 'closed':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700'
      case 'low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros y acciones */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Filtros básicos */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="new">Nuevo</SelectItem>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={unreadOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUnreadOnly(!unreadOnly)}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Solo no leídos
                </Button>
              </div>

              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md">
                  <Switch 
                    checked={autoSync} 
                    onCheckedChange={setAutoSync}
                    id="auto-sync"
                  />
                  <label 
                    htmlFor="auto-sync" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Auto-sincronizar
                  </label>
                  {lastSyncTime && (
                    <span className="text-xs text-muted-foreground ml-2">
                      Última: {format(lastSyncTime, 'HH:mm', { locale: es })}
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => syncEmails(false)}
                  disabled={syncing}
                  variant="outline"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Emails'}
                </Button>
                <Button
                  onClick={cleanupDuplicates}
                  disabled={cleaningDuplicates}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className={`mr-2 h-4 w-4 ${cleaningDuplicates ? 'animate-spin' : ''}`} />
                  {cleaningDuplicates ? 'Limpiando...' : 'Limpiar Duplicados'}
                </Button>
              </div>
            </div>

            {/* Filtros avanzados */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() => setFiltersOpen(!filtersOpen)}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>Filtros avanzados</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {[dateFrom, dateTo, fromEmail, toEmail, subject, bodyText].filter(Boolean).length}
                    </Badge>
                  )}
                </div>
                {filtersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {filtersOpen && (
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fechas */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha desde</label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="Fecha desde"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha hasta</label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="Fecha hasta"
                      />
                    </div>

                    {/* Remitente */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Remitente</label>
                      <Input
                        type="email"
                        value={fromEmail}
                        onChange={(e) => setFromEmail(e.target.value)}
                        placeholder="ejemplo@email.com"
                      />
                    </div>

                    {/* Destinatario */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Destinatario</label>
                      <Input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="ejemplo@email.com"
                      />
                    </div>

                    {/* Asunto */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Asunto</label>
                      <Input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Buscar en asunto..."
                      />
                    </div>

                    {/* Texto del cuerpo */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Texto del cuerpo</label>
                      <Input
                        type="text"
                        value={bodyText}
                        onChange={(e) => setBodyText(e.target.value)}
                        placeholder="Buscar en el contenido del correo..."
                      />
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Cargando tickets...</p>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No hay tickets</p>
            <p className="text-muted-foreground mt-2">
              {unreadOnly
                ? 'No hay tickets con emails no leídos'
                : 'Haz clic en "Sincronizar Emails" para obtener tickets desde Gmail'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => router.push(`/admin/communications/tickets/${ticket.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-sm text-muted-foreground">
                        {ticket.ticket_number}
                      </span>
                      <Badge className={`${getStatusColor(ticket.status)} border`}>
                        {ticket.status}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} border`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {ticket.contact && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {ticket.contact.full_name || ticket.contact.email}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(ticket.updated_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

