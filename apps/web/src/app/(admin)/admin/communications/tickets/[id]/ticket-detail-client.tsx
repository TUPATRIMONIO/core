'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Mail,
  Send,
  User,
  Calendar,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Email {
  id: string
  from_email: string
  to_emails: string[]
  subject: string
  body_html: string
  body_text: string
  direction: 'inbound' | 'outbound'
  sent_at: string
  is_read: boolean
  snippet: string | null
}

interface Activity {
  id: string
  type: string
  subject: string
  description: string | null
  performed_at: string
  performed_by_user: {
    email: string
    first_name: string | null
    last_name: string | null
  } | null
}

interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
  contact: {
    id: string
    email: string
    full_name: string | null
  } | null
  assigned_user: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  } | null
  order: {
    id: string
    order_number: string
    status: string
    amount: number
    currency: string
  } | null
}

interface TicketDetailClientProps {
  ticket: Ticket
  emails: Email[]
  activities: Activity[]
}

export function TicketDetailClient({
  ticket,
  emails: initialEmails,
  activities,
}: TicketDetailClientProps) {
  const router = useRouter()
  const [emails, setEmails] = useState(initialEmails)
  const [replying, setReplying] = useState(false)
  const [replySubject, setReplySubject] = useState(`Re: ${ticket.subject}`)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(ticket.status)
  const [priority, setPriority] = useState(ticket.priority)
  const [updating, setUpdating] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 30 * 1000)

    return () => clearInterval(interval)
  }, [router])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/admin/gmail/sync', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        console.error('Error syncing:', data.error)
      }
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleReply = async () => {
    if (!replyBody.trim() || !ticket.contact) return

    setSending(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ticket.contact.email,
          subject: replySubject,
          body_html: replyBody.replace(/\n/g, '<br>'),
          body_text: replyBody,
          include_signature: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Recargar página para obtener nuevos emails
        router.refresh()
        setReplyBody('')
        setReplying(false)
        alert('Email enviado exitosamente')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setStatus(newStatus)
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority: newPriority }),
      })

      if (response.ok) {
        setPriority(newPriority)
        router.refresh()
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal - Hilo de emails */}
      <div className="lg:col-span-2 space-y-4">
        {/* Información del ticket */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${getStatusColor(status)} border`}>{status}</Badge>
                  <Badge className={`${getPriorityColor(priority)} border`}>{priority}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {ticket.ticket_number}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
                <Link href="/admin/communications/tickets">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </CardContent>
        </Card>

        {/* Hilo de emails */}
        <Card>
          <CardHeader>
            <CardTitle>Conversación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {emails.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay emails en este ticket aún
              </p>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  className={`border rounded-lg p-4 ${
                    email.direction === 'inbound'
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                      : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">
                        {email.direction === 'inbound' ? (
                          <span className="text-blue-700 dark:text-blue-400">De: {email.from_email}</span>
                        ) : (
                          <span className="text-green-700 dark:text-green-400">Para: {email.to_emails.join(', ')}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                        {format(new Date(email.sent_at), "PPpp", { locale: es })}
                      </div>
                    </div>
                    {email.direction === 'inbound' && !email.is_read && (
                      <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700 border">
                        No leído
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold mb-2 text-foreground">{email.subject}</div>
                  {email.body_html ? (
                    <div
                      className="text-sm text-foreground"
                      style={{
                        color: 'hsl(var(--foreground))',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: email.body_html.replace(
                          /style\s*=\s*["'][^"']*color[^"']*["']/gi,
                          ''
                        ).replace(
                          /<style[^>]*>[\s\S]*?<\/style>/gi,
                          ''
                        ) + `
                          <style>
                            body, p, div, span, td, th, a, li, ul, ol, h1, h2, h3, h4, h5, h6 {
                              color: hsl(var(--foreground)) !important;
                            }
                          </style>
                        `,
                      }}
                    />
                  ) : (
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {email.body_text || email.snippet || ''}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor de respuesta */}
        {replying ? (
          <Card>
            <CardHeader>
              <CardTitle>Responder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Para:</label>
                <input
                  type="text"
                  value={ticket.contact?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border rounded-md bg-muted"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Asunto:</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Mensaje:</label>
                <Textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={8}
                  placeholder="Escribe tu respuesta aquí..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleReply} disabled={sending || !replyBody.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? 'Enviando...' : 'Enviar'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReplying(false)
                    setReplyBody('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4">
              <Button onClick={() => setReplying(true)} className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Responder
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Información del contacto */}
        {ticket.contact && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {ticket.contact.full_name || ticket.contact.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {ticket.contact.email}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pedido asociado */}
        {ticket.order && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/admin/orders/${ticket.order.id}`}>
                <div className="flex items-center gap-2 text-blue-600 hover:underline">
                  <Package className="h-4 w-4" />
                  <span className="font-medium">{ticket.order.order_number}</span>
                </div>
              </Link>
              <div className="mt-2 text-sm text-muted-foreground">
                Estado: {ticket.order.status}
              </div>
              <div className="text-sm text-muted-foreground">
                Monto: {ticket.order.amount} {ticket.order.currency}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado y prioridad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Estado:</label>
              <Select value={status} onValueChange={handleStatusChange} disabled={updating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Prioridad:</label>
              <Select value={priority} onValueChange={handlePriorityChange} disabled={updating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Creado: {format(new Date(ticket.created_at), 'PPp', { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Actualizado:{' '}
                {formatDistanceToNow(new Date(ticket.updated_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            {ticket.assigned_user && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Asignado a:{' '}
                  {ticket.assigned_user.first_name || ticket.assigned_user.email}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

