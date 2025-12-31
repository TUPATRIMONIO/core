'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Send, Loader2, ChevronRight, User, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export interface Comment {
  id: string;
  content: string;
  quoted_text?: string;
  selection_from?: number;
  selection_to?: number;
  created_at: string;
  is_resolved?: boolean;
  // Usuario autenticado (usado en panel interno)
  user_id?: string;
  user_name?: string;
  user_email?: string;
  author_first_name?: string;
  author_last_name?: string;
  author_avatar?: string;
  // Visitante externo (usado en panel público)
  visitor_access_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  author_name?: string;
  author_email?: string;
  is_visitor?: boolean;
}

interface CommentsPanelProps {
  documentId: string;
  isOpen: boolean;
  onToggle: () => void;
  canComment: boolean;
  onHighlightText?: (quotedText: string, comment: Comment) => void;
  // Opcionales para cuando se usa desde el visor público
  isPublic?: boolean;
  publicAccessToken?: string;
  initialComments?: Comment[];
  onCommentsChange?: (comments: Comment[]) => void;
  showTrigger?: boolean;
}

export function CommentsPanel({ 
  documentId, 
  isOpen, 
  onToggle, 
  canComment, 
  onHighlightText,
  isPublic = false,
  publicAccessToken,
  initialComments,
  onCommentsChange,
  showTrigger = true
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);

  useEffect(() => {
    onCommentsChange?.(comments);
  }, [comments, onCommentsChange]);

  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Cargar comentarios
  const loadComments = useCallback(async () => {
    // Si ya está cargando o no tenemos token siendo público, salir
    if (isLoading || (isPublic && !publicAccessToken)) {
      console.log('[CommentsPanel] Skipping load:', { isLoading, isPublic, hasToken: !!publicAccessToken });
      return;
    }

    console.log('[CommentsPanel] Loading comments:', { isPublic, publicAccessToken: publicAccessToken?.substring(0, 10) + '...', documentId });
    setIsLoading(true);
    try {
      if (isPublic) {
        const { data, error } = await supabase.rpc('get_public_document_comments', {
          p_access_token: publicAccessToken,
        });
        console.log('[CommentsPanel] RPC response:', { data, error });
        if (error) {
          console.error('[CommentsPanel] RPC Error details:', JSON.stringify(error, null, 2));
          throw error;
        }
        const newComments = data || [];
        setComments(newComments);
        // El callback se maneja en un useEffect separado para evitar loops
      } else {
        const { data, error } = await supabase
          .from('documents_comments')
          .select('*')
          .eq('document_id', documentId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        const newComments = data || [];
        setComments(newComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error, JSON.stringify(error));
    } finally {
      setIsLoading(false);
    }
  }, [documentId, supabase, isPublic, publicAccessToken]); // onCommentsChange e isLoading fuera de deps

  // Cargar al abrir o si es público para auto-apertura
  useEffect(() => {
    if (isOpen || (isPublic && publicAccessToken)) {
      loadComments();
    }
  }, [isOpen, isPublic, publicAccessToken, loadComments]);

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

  // Scroll al fondo cuando llegan nuevos comentarios
  useEffect(() => {
    if (comments.length > 0) {
      const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [comments.length]);

  // Enviar comentario
  async function handleSubmitComment() {
    if (!newComment.trim()) return;

    setIsSending(true);
    try {
      if (isPublic && publicAccessToken) {
        const { error } = await supabase.rpc('add_public_comment', {
          p_access_token: publicAccessToken,
          p_content: newComment.trim(),
        });
        if (error) throw error;
      } else {
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
      }

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

  // Obtener nombre del autor y avatar unificado
  function getAuthorInfo(comment: Comment) {
    // Caso público (viene del RPC)
    if (isPublic || comment.is_visitor || comment.visitor_access_id) {
      const name = comment.author_name || comment.visitor_name || comment.visitor_email?.split('@')[0] || 'Visitante';
      return {
        name,
        email: comment.author_email || comment.visitor_email || '',
        isExternal: true,
        avatar: null,
        initials: name[0]?.toUpperCase() || 'V'
      };
    }
    
    // Caso interno (viene de la vista)
    const firstName = comment.author_first_name || '';
    const lastName = comment.author_last_name || '';
    const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : (comment.user_name || comment.user_email?.split('@')[0] || 'Usuario');
    
    return {
      name,
      email: comment.user_email || '',
      isExternal: false,
      avatar: comment.author_avatar,
      initials: (firstName[0] || name[0] || 'U').toUpperCase()
    };
  }

  if (!isOpen) {
    if (!showTrigger) return null;
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-20 z-50 shadow-md bg-background hover:bg-muted"
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
    <div className="w-80 border-l bg-card flex flex-col h-full overflow-hidden shadow-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Comentarios
          {comments.length > 0 && (
            <Badge variant="secondary" className="font-normal">{comments.length}</Badge>
          )}
        </h3>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentarios */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="p-4">
          {isLoading && comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No hay comentarios</p>
              <p className="text-xs text-muted-foreground/60 px-4">
                {canComment ? 'Sé el primero en dejar un comentario o sugerencia.' : 'No tienes permisos para comentar.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => {
                const author = getAuthorInfo(comment);
                return (
                  <div key={comment.id} className="group">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
                        {author.avatar && author.avatar !== 'null' ? (
                          <img src={author.avatar} alt={author.name} />
                        ) : (
                          <AvatarFallback className={author.isExternal ? 'bg-orange-100 text-orange-700' : 'bg-primary/10 text-primary'}>
                            {author.initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold truncate text-foreground/90">
                            {author.name}
                          </span>
                          {author.isExternal && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase tracking-tight font-bold border-orange-200 text-orange-700 bg-orange-50">
                              Externo
                            </Badge>
                          )}
                        </div>
                        
                        {/* Texto citado - clickeable para resaltar */}
                        {comment.quoted_text && (
                          <div 
                            className={`mb-2 pl-3 border-l-2 border-primary/30 text-xs text-muted-foreground italic leading-relaxed py-1 bg-muted/40 rounded-r-md group-hover:border-primary/60 transition-colors ${onHighlightText ? 'cursor-pointer hover:bg-primary/5' : ''}`}
                            onClick={() => onHighlightText?.(comment.quoted_text!, comment)}
                            title={onHighlightText ? 'Clic para ver en el documento' : undefined}
                          >
                            <span className="line-clamp-3">"{comment.quoted_text}"</span>
                          </div>
                        )}
                        
                        <div className="text-sm text-foreground/80 leading-snug break-words">
                          {comment.content}
                        </div>

                        <div className="mt-2 text-[10px] text-muted-foreground/60 flex items-center gap-2">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Nuevo comentario */}
      {canComment && (
        <div className="p-4 border-t bg-muted/10">
          <Textarea
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitComment();
              }
            }}
            className="mb-3 resize-none text-sm min-h-[80px] focus-visible:ring-primary shadow-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              Tip: Press <kbd className="font-sans border rounded px-1">Ctrl + Enter</kbd> to send
            </span>
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSending}
              className="gap-2"
            >
              {isSending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
