'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, FileText, MessageSquare, Send, Loader2, Eye, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTextSelection } from '@/hooks/useTextSelection';
import { TextSelectionPopup } from '@/components/documents/editor/TextSelectionPopup';
import { CommentDialog } from '@/components/documents/editor/CommentDialog';
import { CommentOnboardingTooltip } from '@/components/documents/editor/CommentOnboardingTooltip';

interface PublicDocumentViewerProps {
  token: string;
}

interface DocumentData {
  id: string;
  title: string;
  content: any;
  access_level: 'view' | 'comment';
  allow_comments: boolean;
}

interface Comment {
  id: string;
  content: string;
  quoted_text?: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

export function PublicDocumentViewer({ token }: PublicDocumentViewerProps) {
  const [step, setStep] = useState<'email' | 'document'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [pendingQuotedText, setPendingQuotedText] = useState<{ text: string; from: number; to: number } | null>(null);
  
  // Ref for text selection
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Editor en modo solo lectura
  const editor = useEditor({
    extensions: [StarterKit],
    content: docData?.content || '',
    editable: false,
    immediatelyRender: false,
  });

  // Actualizar contenido del editor cuando cambie el documento
  useEffect(() => {
    if (editor && docData?.content) {
      editor.commands.setContent(docData.content);
    }
  }, [editor, docData?.content]);

  // Verificar si ya hay un token guardado en localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(`doc_access_${token}`);
    if (savedToken) {
      setAccessToken(savedToken);
      loadDocument(savedToken);
    }
  }, [token]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('register_public_document_access', {
        p_token: token,
        p_email: email.trim(),
        p_name: name.trim() || null,
      });

      if (error) {
        toast.error('Error al acceder al documento');
        console.error(error);
        return;
      }

      // Guardar access token
      localStorage.setItem(`doc_access_${token}`, data.access_token);
      setAccessToken(data.access_token);
      setDocData(data.document);
      setStep('document');
    } catch (error) {
      toast.error('Documento no encontrado o no es público');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDocument(accessToken: string) {
    setIsLoading(true);
    try {
      // Recargar documento con el token existente
      const { data, error } = await supabase.rpc('register_public_document_access', {
        p_token: token,
        p_email: email || 'returning@visitor.com', // Email placeholder para visitante recurrente
      });

      if (error) {
        // Token inválido, limpiar y pedir email de nuevo
        localStorage.removeItem(`doc_access_${token}`);
        setStep('email');
        return;
      }

      setDocData(data.document);
      setStep('document');
    } catch (error) {
      localStorage.removeItem(`doc_access_${token}`);
      setStep('email');
    } finally {
      setIsLoading(false);
    }
  }

  // Text selection hook for commenting on selected text
  const { selection, hasSelection, clearSelection } = useTextSelection({
    containerRef: editorContainerRef,
    enabled: docData?.allow_comments && step === 'document',
  });

  // Handle click on "Comentar" button when text is selected
  function handleAddSelectionComment() {
    if (!selection) return;
    
    setPendingQuotedText({
      text: selection.text,
      from: selection.from,
      to: selection.to,
    });
    setShowCommentDialog(true);
    clearSelection();
  }

  // Submit comment with quoted text
  async function handleQuotedCommentSubmit(content: string) {
    if (!accessToken || !pendingQuotedText) return;

    try {
      const { data, error } = await supabase.rpc('add_public_comment', {
        p_access_token: accessToken,
        p_content: content,
        p_quoted_text: pendingQuotedText.text,
      });

      if (error) {
        toast.error('Error al agregar comentario');
        console.error(error);
        return;
      }

      setComments([...comments, data]);
      setPendingQuotedText(null);
      setShowComments(true); // Abrir panel de comentarios para ver el nuevo
      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al agregar comentario');
      throw error;
    }
  }


  async function handleSubmitComment() {
    if (!newComment.trim() || !accessToken) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('add_public_comment', {
        p_access_token: accessToken,
        p_content: newComment.trim(),
      });

      if (error) {
        toast.error('Error al agregar comentario');
        console.error(error);
        return;
      }

      setComments([...comments, data]);
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al agregar comentario');
    } finally {
      setIsLoading(false);
    }
  }

  // Highlight quoted text in the document when clicking on a comment
  function handleHighlightText(quotedText: string) {
    if (!editorContainerRef.current || !quotedText) return;

    // Add animation keyframes if not already present
    if (!window.document.getElementById('comment-highlight-styles')) {
      const style = window.document.createElement('style');
      style.id = 'comment-highlight-styles';
      style.textContent = `
        @keyframes pulse-highlight {
          0%, 100% { background-color: hsl(var(--primary) / 0.4); }
          50% { background-color: hsl(var(--primary) / 0.2); }
        }
        .comment-highlight-active {
          background-color: hsl(var(--primary) / 0.4);
          animation: pulse-highlight 0.5s ease-in-out 3;
          border-radius: 2px;
        }
      `;
      window.document.head.appendChild(style);
    }

    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();

    editorContainerRef.current.focus();

    // @ts-ignore - window.find is not in TypeScript types but exists in browsers
    const found = window.find(quotedText, false, false, true, false, true, false);

    if (found && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Scroll into view
      const scrollContainer = editorContainerRef.current.closest('.overflow-auto');
      if (scrollContainer) {
        const rect = range.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop + rect.top - containerRect.top - 150;
        scrollContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
      }

      try {
        const highlightSpan = window.document.createElement('span');
        highlightSpan.className = 'comment-highlight-active';
        range.surroundContents(highlightSpan);

        setTimeout(() => {
          if (highlightSpan.parentNode) {
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
              parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            parent.removeChild(highlightSpan);
          }
        }, 2000);
      } catch (e) {
        setTimeout(() => selection?.removeAllRanges(), 2000);
      }
    } else {
      const editorText = editorContainerRef.current.textContent || '';
      if (!editorText.includes(quotedText)) {
        toast.info('El texto citado ya no existe en el documento');
      }
    }
  }


  // Pantalla de solicitud de email
  if (step === 'email') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Documento Compartido</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico para acceder al documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tu nombre (opcional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Ver Documento
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Tu correo será registrado para fines de trazabilidad
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista del documento
  return (
    <div className="flex h-screen">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b px-6 py-4 flex items-center justify-between bg-card">
          <div>
            <h1 className="text-2xl font-bold">{document?.title || 'Documento'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Modo solo lectura
              {docData?.allow_comments && ' • Puedes comentar'}
            </p>
          </div>
          {docData?.allow_comments && (
            <Button 
              variant="outline" 
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
            </Button>
          )}
        </header>

        {/* Editor (solo lectura) */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={editorContainerRef} className="max-w-4xl mx-auto">
            <EditorContent
              editor={editor}
              className="prose prose-lg dark:prose-invert max-w-none min-h-[500px]"
            />
          </div>
        </div>
      </div>

      {/* Text Selection Popup */}
      {hasSelection && selection?.rect && document?.allow_comments && (
        <TextSelectionPopup
          position={{ top: selection.rect.top, left: selection.rect.left + selection.rect.width / 2 }}
          onAddComment={handleAddSelectionComment}
        />
      )}

      {/* Comment Dialog */}
      <CommentDialog
        open={showCommentDialog}
        onOpenChange={setShowCommentDialog}
        quotedText={pendingQuotedText?.text || ''}
        onSubmit={handleQuotedCommentSubmit}
      />

      {/* Onboarding Tooltip */}
      {docData?.allow_comments && <CommentOnboardingTooltip />}

      {/* Panel de comentarios */}
      {showComments && docData?.allow_comments && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Comentarios</h3>
          </div>

          {/* Lista de comentarios */}
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay comentarios aún
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {comment.author_name?.[0]?.toUpperCase() || comment.author_email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author_name || comment.author_email.split('@')[0]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      {/* Quoted text - clickable to highlight */}
                      {comment.quoted_text && (
                        <div 
                          className="mt-1 pl-2 border-l-2 border-primary/50 text-xs text-muted-foreground italic cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors rounded-r py-1 pr-1"
                          onClick={() => handleHighlightText(comment.quoted_text!)}
                          title="Clic para ver en el documento"
                        >
                          "{comment.quoted_text.length > 100 ? comment.quoted_text.slice(0, 100) + '...' : comment.quoted_text}"
                        </div>
                      )}
                      <p className="text-sm mt-1">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Nuevo comentario */}
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
              disabled={!newComment.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
