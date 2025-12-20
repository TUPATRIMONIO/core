'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Loader2, ChevronRight, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Comment {
  id: string;
  content: string;
  quoted_text?: string;
  created_at: string;
  is_resolved: boolean;
  // Usuario autenticado
  user_id?: string;
  user_name?: string;
  user_email?: string;
  // Visitante externo
  visitor_access_id?: string;
  visitor_name?: string;
  visitor_email?: string;
}

interface CommentsPanelProps {
  documentId: string;
  isOpen: boolean;
  onToggle: () => void;
  canComment: boolean;
}

export function CommentsPanel({ documentId, isOpen, onToggle, canComment }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const supabase = createClient();

  // Cargar comentarios
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Usar la vista que une con usuarios
      const { data, error } = await supabase
        .from('documents_comments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, supabase]);

  // Cargar al abrir
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`comments:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'documents',
          table: 'comments',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, isOpen, supabase, loadComments]);

  // Enviar comentario
  async function handleSubmitComment() {
    if (!newComment.trim()) return;

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Debes iniciar sesión para comentar');
        return;
      }

      const { error } = await supabase
        .from('documents_comments')
        .insert({
          document_id: documentId,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      toast.success('Comentario agregado');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    } finally {
      setIsSending(false);
    }
  }

  // Obtener nombre del autor
  function getAuthorInfo(comment: Comment) {
    if (comment.visitor_access_id) {
      return {
        name: comment.visitor_name || comment.visitor_email?.split('@')[0] || 'Visitante',
        email: comment.visitor_email || '',
        isExternal: true,
      };
    }
    return {
      name: comment.user_name || comment.user_email?.split('@')[0] || 'Usuario',
      email: comment.user_email || '',
      isExternal: false,
    };
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-20 z-50"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Comentarios
        {comments.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="w-80 border-l bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comentarios
          {comments.length > 0 && (
            <Badge variant="secondary">{comments.length}</Badge>
          )}
        </h3>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentarios */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay comentarios aún
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const author = getAuthorInfo(comment);
              return (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={author.isExternal ? 'bg-orange-100 text-orange-700' : ''}>
                        {author.name[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">
                          {author.name}
                        </span>
                        {author.isExternal && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Externo
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      
                      {/* Texto citado */}
                      {comment.quoted_text && (
                        <div className="mt-1 pl-2 border-l-2 border-muted text-xs text-muted-foreground italic">
                          "{comment.quoted_text}"
                        </div>
                      )}
                      
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Nuevo comentario */}
      {canComment && (
        <div className="p-4 border-t">
          <Textarea
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2 resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSending}
            className="w-full"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar
          </Button>
        </div>
      )}
    </div>
  );
}
