'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Download, User, Building2, Paperclip } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Attachment {
  path: string
  name: string
  size: number
  type: string
  signedUrl?: string
}

interface Note {
  id: string
  sender_type: 'admin' | 'notary'
  message: string
  action_type: string
  attachments: Attachment[]
  created_at: string
}

interface NotaryAssignmentChatProps {
  assignmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
}

export function NotaryAssignmentChat({
  assignmentId,
  open,
  onOpenChange,
  title
}: NotaryAssignmentChatProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && assignmentId) {
      fetchNotes()
    }
  }, [open, assignmentId])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 150)
  }

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notary/assignment-notes?assignmentId=${assignmentId}`)
      if (res.ok) {
        const data = await res.json()
        setNotes(data)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'needs_correction':
        return <Badge variant="destructive" className="text-[10px]">Solicitó corrección</Badge>
      case 'needs_documents':
        return <Badge variant="destructive" className="text-[10px]">Solicitó documentos</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="text-[10px]">Rechazado</Badge>
      case 'resolved':
        return <Badge className="bg-green-600 text-[10px]">Resuelto</Badge>
      case 'received':
        return <Badge variant="secondary" className="text-[10px]">Recibido</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="text-[10px]">En proceso</Badge>
      case 'completed':
        return <Badge className="bg-blue-600 text-[10px]">Completado</Badge>
      default:
        return null
    }
  }

  const handleDownload = (att: Attachment) => {
    if (att.signedUrl) {
      window.open(att.signedUrl, '_blank')
    } else {
      console.warn('No signed URL for attachment', att)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px] flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b shrink-0">
          <SheetTitle className="text-base">Historial de Conversación</SheetTitle>
          <SheetDescription className="truncate text-xs">
            {title || 'Documento'}
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No hay mensajes en el historial.
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => {
                const isAdmin = note.sender_type === 'admin'
                const attachments = Array.isArray(note.attachments) 
                  ? note.attachments 
                  : (typeof note.attachments === 'string' ? JSON.parse(note.attachments) : [])

                return (
                  <div
                    key={note.id}
                    className={`flex gap-2 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-5 ${
                      isAdmin ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isAdmin ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>

                    <div className={`flex flex-col gap-0.5 min-w-0 max-w-[85%] ${isAdmin ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {isAdmin ? 'Equipo TuPatrimonio' : 'Notaría'}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {format(new Date(note.created_at), "d MMM, HH:mm", { locale: es })}
                        </span>
                      </div>

                      <div className={`rounded-lg p-3 text-sm shadow-sm ${
                        isAdmin 
                          ? 'bg-muted text-foreground rounded-tl-none' 
                          : 'bg-orange-50 border border-orange-200 text-orange-900 rounded-tr-none dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-800'
                      }`}>
                        {note.action_type && (
                          <div className="mb-1.5">
                            {getActionBadge(note.action_type)}
                          </div>
                        )}
                        
                        {note.message && (
                          <p className="whitespace-pre-wrap break-words text-[13px]">{note.message}</p>
                        )}

                        {attachments && attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5 pt-2 border-t border-black/5">
                            <div className="text-[10px] font-semibold opacity-60 uppercase tracking-wider flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              Adjuntos ({attachments.length})
                            </div>
                            {attachments.map((att: any, i: number) => (
                              <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start h-auto py-1.5 bg-background/50 hover:bg-background/80 border-black/5 text-xs"
                                onClick={() => handleDownload(att)}
                              >
                                <FileText className="h-3 w-3 mr-1.5 shrink-0 text-blue-500" />
                                <span className="truncate flex-1 text-left" title={att.name}>{att.name}</span>
                                <Download className="h-3 w-3 ml-1.5 shrink-0 opacity-50" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
