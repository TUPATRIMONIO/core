'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Message {
  id: string
  message: string
  is_internal: boolean
  created_at: string
  user?: {
    id: string
    email: string
    full_name: string
  }
}

interface DocumentMessageThreadProps {
  documentId: string
  initialMessages: Message[]
  onMessageAdded?: (message: Message) => void
}

export function DocumentMessageThread({
  documentId,
  initialMessages,
  onMessageAdded,
}: DocumentMessageThreadProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('El mensaje no puede estar vacío')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/document-review/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          message: newMessage.trim(),
          is_internal: isInternal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar el mensaje')
      }

      const data = result.message
      setMessages([...messages, data])
      setNewMessage('')
      setIsInternal(false)
      
      if (onMessageAdded) {
        onMessageAdded(data)
      }

      toast.success('Mensaje enviado')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Error al enviar mensaje')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversación
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay mensajes aún</p>
              <p className="text-sm">Sé el primero en comentar</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.is_internal
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {msg.user?.full_name || msg.user?.email || 'Usuario'}
                    </span>
                    {msg.is_internal && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="h-3 w-3 mr-1" />
                        Interno
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de nuevo mensaje */}
        <div className="space-y-2 border-t pt-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSendMessage()
                }
              }}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal-message"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                />
                <Label htmlFor="internal-message" className="text-sm cursor-pointer">
                  Mensaje interno
                </Label>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

