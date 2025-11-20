/**
 * Página: Vista de Thread/Conversación
 * Muestra todos los emails de una conversación agrupados
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Mail, 
  Reply, 
  Archive,
  Trash2,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  User as UserIcon
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { EmailComposer } from '@/components/crm/EmailComposer';
import type { EmailThread, Email } from '@/types/crm';

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default function ThreadViewPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [threadId, setThreadId] = useState<string>('');
  const [thread, setThread] = useState<EmailThread | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReply, setShowReply] = useState(false);
  
  const currentFolder = searchParams.get('folder') || 'Inbox';

  useEffect(() => {
    params.then(p => {
      setThreadId(p.threadId);
      loadThread(p.threadId);
    });
  }, [params]);

  async function loadThread(id: string) {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/crm/inbox/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load thread');
      }

      const data = await response.json();
      setThread(data.thread);
      setEmails(data.emails || []);
    } catch (error) {
      console.error('Error loading thread:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la conversación',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function archiveThread() {
    if (!threadId) return;
    await moveToFolder('Archived', 'Conversación archivada', 'Movida a Archived');
  }

  async function moveToTrash() {
    if (!threadId) return;
    await moveToFolder('Trash', 'Conversación eliminada', 'Movida a Trash');
  }

  async function restoreFromTrash() {
    if (!threadId) return;
    await moveToFolder('Inbox', 'Conversación restaurada', 'Movida de vuelta a Inbox');
  }

  async function deletePermanently() {
    if (!threadId) return;
    
    if (!confirm('¿Estás seguro de eliminar permanentemente esta conversación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/crm/inbox/${threadId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast({
        title: 'Conversación eliminada',
        description: 'La conversación ha sido eliminada permanentemente',
      });

      router.push('/dashboard/crm/inbox');
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la conversación',
        variant: 'destructive',
      });
    }
  }

  async function moveToFolder(folderName: string, title: string, description: string) {
    if (!threadId) return;

    try {
      const response = await fetch(`/api/crm/inbox/${threadId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_name: folderName })
      });

      if (!response.ok) throw new Error('Failed to move');

      toast({
        title,
        description,
      });

      // Mantener query params al volver
      const backUrl = searchParams.toString() 
        ? `/dashboard/crm/inbox?${searchParams.toString()}`
        : '/dashboard/crm/inbox';
      
      router.push(backUrl);
    } catch (error) {
      console.error('Error moving thread:', error);
      toast({
        title: 'Error',
        description: 'No se pudo mover la conversación',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-gray-500">Cargando conversación...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="space-y-6">
        <p className="text-gray-500">Conversación no encontrada</p>
        <Button onClick={() => router.push('/dashboard/crm/inbox')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Inbox
        </Button>
      </div>
    );
  }

  const lastEmail = emails[emails.length - 1];
  const replyTo = lastEmail?.from_email || thread.contact?.email || '';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/dashboard/crm/inbox')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {thread.subject || '(Sin asunto)'}
            </h1>
            {thread.contact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Con: {thread.contact.full_name} ({thread.contact.email})
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {/* Botones según carpeta actual */}
          {currentFolder === 'Trash' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={restoreFromTrash}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deletePermanently}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Eliminar Permanentemente
              </Button>
            </>
          ) : (
            <>
              {currentFolder !== 'Archived' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={archiveThread}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archivar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={moveToTrash}
              >
                <Trash2 className="w-4 h-4 mr-2 text-red-600" />
                Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info del thread */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {thread.email_count} {thread.email_count === 1 ? 'mensaje' : 'mensajes'}
              </span>
            </div>
            
            {thread.participants && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {thread.participants.length} participantes
                </span>
              </div>
            )}

            {thread.contact && (
              <a
                href={`/dashboard/crm/contacts/${thread.contact_id}`}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Ver contacto
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Emails en el Thread */}
      <div className="space-y-3">
        {emails.map((email, index) => (
          <Card key={email.id} className={
            email.direction === 'outbound' 
              ? 'border-l-4 border-l-green-500' 
              : 'border-l-4 border-l-blue-500'
          }>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header del Email */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${
                        email.direction === 'outbound' 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {email.direction === 'outbound' ? '📤 Enviado' : '📨 Recibido'}
                      </span>
                      {email.direction === 'outbound' && email.sent_from_account && (
                        <span className="text-xs text-gray-500">
                          desde {email.sent_from_account.email_address}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>De:</strong> {email.from_email}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Para:</strong> {email.to_emails.join(', ')}
                    </p>
                    {email.cc_emails && email.cc_emails.length > 0 && (
                      <p className="text-sm text-gray-500">
                        <strong>CC:</strong> {email.cc_emails.join(', ')}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 shrink-0">
                    {email.sent_at 
                      ? new Date(email.sent_at).toLocaleString('es-CL')
                      : 'N/A'
                    }
                  </p>
                </div>

                {/* Cuerpo del Email */}
                <div 
                  className="prose dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: email.body_html || email.body_text || '' }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulario de Respuesta */}
      <div className="sticky bottom-0 bg-background pt-6">
        {!showReply ? (
          <Button
            onClick={() => setShowReply(true)}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            <Reply className="w-4 h-4 mr-2" />
            Responder
          </Button>
        ) : (
          <EmailComposer
            defaultTo={replyTo}
            defaultSubject={`RE: ${thread.subject || ''}`}
            contactId={thread.contact_id}
            onSent={() => {
              setShowReply(false);
              loadThread(threadId);
              toast({
                title: 'Respuesta enviada',
                description: 'Tu respuesta ha sido enviada y agregada a la conversación',
              });
            }}
            onCancel={() => setShowReply(false)}
          />
        )}
      </div>
    </div>
  );
}

