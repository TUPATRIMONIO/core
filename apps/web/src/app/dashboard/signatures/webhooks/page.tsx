'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tupatrimonio/ui'
import { Button } from '@tupatrimonio/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

interface Webhook {
  id: string
  organization_id: string
  name: string
  url: string
  secret: string
  event_types: string[]
  is_active: boolean
  created_at: string
}

const AVAILABLE_EVENTS = [
  { value: 'document_created', label: 'Documento creado' },
  { value: 'document_sent', label: 'Documento enviado' },
  { value: 'signer_signed', label: 'Firmante firmó' },
  { value: 'document_fully_signed', label: 'Documento completamente firmado' },
  { value: 'document_rejected', label: 'Documento rechazado' },
  { value: 'document_expired', label: 'Documento expirado' },
  { value: 'notary_completed', label: 'Servicio notarial completado' },
]

export default function WebhooksPage() {
  const { toast } = useToast()
  const { currentOrganization, user } = useAuthStore()

  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Form state
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (currentOrganization) {
      loadWebhooks()
    }
  }, [currentOrganization?.id])

  const loadWebhooks = async () => {
    if (!currentOrganization) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .schema('signatures')
        .from('webhooks')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setWebhooks(data || [])
    } catch (error) {
      console.error('Error loading webhooks:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los webhooks',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization || !user) return

    setIsCreating(true)

    try {
      const supabase = createClient()

      // Generate secret
      const secret = crypto.randomUUID()

      const { error } = await supabase
        .schema('signatures')
        .from('webhooks')
        .insert({
          organization_id: currentOrganization.id,
          name,
          url,
          secret,
          event_types: selectedEvents.length > 0 ? selectedEvents : ['*'],
          is_active: true,
          created_by: user.id,
        })

      if (error) throw error

      toast({
        title: 'Webhook creado',
        description: 'El webhook se ha configurado correctamente',
      })

      setName('')
      setUrl('')
      setSelectedEvents([])
      setShowCreateForm(false)
      loadWebhooks()
    } catch (error) {
      console.error('Error creating webhook:', error)
      toast({
        title: 'Error',
        description: 'No se pudo crear el webhook',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (webhookId: string) => {
    if (!confirm('¿Estás seguro de eliminar este webhook?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('signatures')
        .from('webhooks')
        .delete()
        .eq('id', webhookId)

      if (error) throw error

      toast({
        title: 'Webhook eliminado',
        description: 'El webhook ha sido eliminado',
      })

      loadWebhooks()
    } catch (error) {
      console.error('Error deleting webhook:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el webhook',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (webhookId: string, isActive: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .schema('signatures')
        .from('webhooks')
        .update({ is_active: !isActive })
        .eq('id', webhookId)

      if (error) throw error

      toast({
        title: isActive ? 'Webhook desactivado' : 'Webhook activado',
        description: 'El estado del webhook ha sido actualizado',
      })

      loadWebhooks()
    } catch (error) {
      console.error('Error toggling webhook:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el webhook',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copiado',
      description: 'Texto copiado al portapapeles',
    })
  }

  const toggleEventSelection = (eventValue: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventValue)
        ? prev.filter(e => e !== eventValue)
        : [...prev, eventValue]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configura webhooks para recibir eventos en tiempo real
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo webhook
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear webhook</CardTitle>
            <CardDescription>
              Configura un nuevo endpoint para recibir eventos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mi webhook de producción"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  URL del endpoint *
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://mi-api.com/webhooks/tupatrimonio"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Debe ser una URL HTTPS válida
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Eventos (opcional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event.value}
                      className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                        selectedEvents.includes(event.value)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.value)}
                        onChange={() => toggleEventSelection(event.value)}
                        className="sr-only"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Si no seleccionas ninguno, recibirás todos los eventos
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creando...' : 'Crear webhook'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Webhooks list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando webhooks...
          </div>
        ) : webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium">No hay webhooks configurados</h3>
              <p className="text-muted-foreground mb-4">
                Configura un webhook para recibir eventos en tiempo real
              </p>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer webhook
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{webhook.name}</CardTitle>
                    <CardDescription className="mt-1 break-all">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={webhook.is_active ? 'default' : 'outline'}
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                    >
                      {webhook.is_active ? 'Activo' : 'Inactivo'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Signing secret
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                      {showSecrets[webhook.id] ? webhook.secret : '••••••••••••••••'}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setShowSecrets(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))
                      }
                    >
                      {showSecrets[webhook.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(webhook.secret)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Eventos</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {webhook.event_types.includes('*') ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Todos los eventos
                      </span>
                    ) : (
                      webhook.event_types.map((eventType) => (
                        <span
                          key={eventType}
                          className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                        >
                          {AVAILABLE_EVENTS.find(e => e.value === eventType)?.label || eventType}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Creado: {new Date(webhook.created_at).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

