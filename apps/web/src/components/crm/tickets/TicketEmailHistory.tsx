'use client';

/**
 * TicketEmailHistory
 * Muestra el historial de emails relacionados con un ticket
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, ArrowUp, ArrowDown, Eye, EyeOff, Reply, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/crm/formatters';

interface TicketEmail {
  email_id: string;
  subject: string;
  from_email: string;
  to_emails: string[];
  body_html?: string;
  body_text?: string;
  direction: 'inbound' | 'outbound';
  sent_at: string;
  is_read: boolean;
  contact_name?: string;
  thread_id?: string;
  message_id?: string;
}

interface TicketEmailHistoryProps {
  ticketId: string;
  ticketNumber?: string;
  ticketSubject?: string;
  className?: string;
  refreshTrigger?: number; // Para refrescar cuando se envía un email
  onReply?: (email: TicketEmail) => void; // Callback para responder a un email
}

export function TicketEmailHistory({ 
  ticketId, 
  ticketNumber,
  ticketSubject,
  className = '', 
  refreshTrigger,
  onReply
}: TicketEmailHistoryProps) {
  const [emails, setEmails] = useState<TicketEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmails();
  }, [ticketId, refreshTrigger]);

  const fetchEmails = async () => {
    try {
      const response = await fetch(`/api/crm/tickets/${ticketId}/emails`);
      if (!response.ok) throw new Error('Error fetching emails');
      
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error('Error fetching ticket emails:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Historial de Emails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Cargando emails...</p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar emails por thread_id
  const groupEmailsByThread = (emails: TicketEmail[]) => {
    const threads: Record<string, TicketEmail[]> = {};
    const standalone: TicketEmail[] = [];
    const emailThreadMap: Record<string, string> = {}; // email_id -> thread_id

    // Primero, identificar todos los thread_ids únicos
    emails.forEach((email) => {
      const threadId = email.thread_id || email.message_id;
      if (threadId) {
        emailThreadMap[email.email_id] = threadId;
      }
    });

    // Agrupar emails por thread_id
    emails.forEach((email) => {
      const threadId = email.thread_id || email.message_id || email.email_id;
      
      // Si el thread_id es diferente al email_id, es parte de un thread
      // O si hay otros emails con el mismo thread_id
      const emailsInThread = emails.filter(e => 
        (e.thread_id || e.message_id || e.email_id) === threadId
      );
      
      if (emailsInThread.length > 1) {
        // Hay múltiples emails con el mismo thread_id
        if (!threads[threadId]) {
          threads[threadId] = [];
        }
        if (!threads[threadId].find(e => e.email_id === email.email_id)) {
          threads[threadId].push(email);
        }
      } else {
        // Email standalone (sin otros emails en el mismo thread)
        standalone.push(email);
      }
    });

    // Ordenar emails dentro de cada thread por fecha
    Object.keys(threads).forEach((threadId) => {
      threads[threadId].sort((a, b) => 
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
      );
    });

    // Ordenar standalone por fecha (más reciente primero)
    standalone.sort((a, b) => 
      new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
    );

    return { threads, standalone };
  };

  const { threads, standalone } = groupEmailsByThread(emails);
  const totalThreads = Object.keys(threads).length;
  const totalEmails = emails.length;

  if (emails.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Historial de Emails
          </CardTitle>
          <CardDescription>
            Emails relacionados con este ticket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hay emails relacionados con este ticket
          </p>
        </CardContent>
      </Card>
    );
  }

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Conversación
          <Badge variant="secondary">{totalEmails} email{totalEmails !== 1 ? 's' : ''}</Badge>
          {totalThreads > 0 && (
            <Badge variant="outline">{totalThreads} hilo{totalThreads !== 1 ? 's' : ''}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Historial completo de emails del ticket
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Hilos de conversación */}
          {Object.entries(threads).map(([threadId, threadEmails]) => {
            const isExpanded = expandedThreads.has(threadId);
            const firstEmail = threadEmails[0];
            const lastEmail = threadEmails[threadEmails.length - 1];
            
            return (
              <div
                key={threadId}
                className="border rounded-lg overflow-hidden"
              >
                {/* Header del Thread */}
                <div
                  className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleThread(threadId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Reply className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          {firstEmail.subject}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {threadEmails.length} mensaje{threadEmails.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {formatRelativeTime(firstEmail.sent_at)} - {formatRelativeTime(lastEmail.sent_at)}
                        </span>
                        <span>
                          {threadEmails.filter(e => e.direction === 'inbound').length} recibido{threadEmails.filter(e => e.direction === 'inbound').length !== 1 ? 's' : ''}, {' '}
                          {threadEmails.filter(e => e.direction === 'outbound').length} enviado{threadEmails.filter(e => e.direction === 'outbound').length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThread(threadId);
                      }}
                    >
                      {isExpanded ? 'Ocultar' : 'Expandir'}
                    </Button>
                  </div>
                </div>

                {/* Emails del Thread */}
                {isExpanded && (
                  <div className="divide-y">
                    {threadEmails.map((email, index) => (
                      <EmailItem
                        key={email.email_id}
                        email={email}
                        isThreadReply={index > 0}
                        isExpanded={expandedEmail === email.email_id}
                        onToggleExpand={() => setExpandedEmail(
                          expandedEmail === email.email_id ? null : email.email_id
                        )}
                        onReply={onReply}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Emails standalone (sin thread) */}
          {standalone.map((email) => (
            <EmailItem
              key={email.email_id}
              email={email}
              isThreadReply={false}
              isExpanded={expandedEmail === email.email_id}
              onToggleExpand={() => setExpandedEmail(
                expandedEmail === email.email_id ? null : email.email_id
              )}
              onReply={onReply}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para renderizar un email individual
function EmailItem({
  email,
  isThreadReply,
  isExpanded,
  onToggleExpand,
  onReply
}: {
  email: TicketEmail;
  isThreadReply: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onReply?: (email: TicketEmail) => void;
}) {
  return (
    <div
      className={`p-4 ${
        isThreadReply ? 'ml-6 border-l-2 border-gray-200 dark:border-gray-700' : ''
      } ${
        email.direction === 'inbound' 
          ? 'bg-blue-50/50 dark:bg-blue-950/20' 
          : 'bg-green-50/50 dark:bg-green-950/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {email.direction === 'inbound' ? (
              <ArrowDown className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <ArrowUp className="w-4 h-4 text-green-600 shrink-0" />
            )}
            <span className="font-medium text-sm shrink-0">
              {email.direction === 'inbound' ? 'De' : 'Para'}
            </span>
            <span className="text-sm truncate">
              {email.direction === 'inbound' ? email.from_email : email.to_emails.join(', ')}
            </span>
            {email.contact_name && (
              <Badge variant="outline" className="shrink-0">
                {email.contact_name}
              </Badge>
            )}
            {isThreadReply && (
              <Badge variant="secondary" className="text-xs shrink-0">
                <Reply className="w-3 h-3 mr-1" />
                Respuesta
              </Badge>
            )}
          </div>
          
          <h4 className="font-medium text-sm mb-2">
            {email.subject}
          </h4>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{formatRelativeTime(email.sent_at)}</span>
            <div className="flex items-center gap-1">
              {email.is_read ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{email.is_read ? 'Leído' : 'No leído'}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {email.body_html ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: email.body_html }}
                    className="text-sm"
                  />
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {email.body_text}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {onReply && email.direction === 'inbound' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply(email)}
              className="text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Responder
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
          >
            {isExpanded ? 'Ocultar' : 'Ver'}
          </Button>
        </div>
      </div>
    </div>
  );
}
