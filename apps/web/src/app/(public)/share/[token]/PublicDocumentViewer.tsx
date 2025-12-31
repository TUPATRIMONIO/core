'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, FileText, MessageSquare, Send, Loader2, Eye, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTextSelection } from '@/hooks/useTextSelection';
import { TextSelectionPopup } from '@/components/documents/editor/TextSelectionPopup';
import { CommentDialog } from '@/components/documents/editor/CommentDialog';
import { CommentOnboardingTooltip } from '@/components/documents/editor/CommentOnboardingTooltip';
import { CommentsPanel, type Comment } from '@/components/documents/editor/CommentsPanel';

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

// Comment interface handled by import

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
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [pendingQuotedText, setPendingQuotedText] = useState<{ text: string; from: number; to: number } | null>(null);
  
  // Ref for text selection
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  // Editor en modo solo lectura
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false, // Prevent navigation inside editor
        HTMLAttributes: {
          class: 'text-primary underline',
          target: '_blank',
        },
      }),
    ],
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

  // Comments are now handled by CommentsPanel component

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

  // Handle comments update with stability
  const handleCommentsChange = useCallback((newComments: Comment[]) => {
    setComments(newComments);
    if (!hasAutoOpened && newComments.length > 0) {
      setShowComments(true);
      setHasAutoOpened(true);
    }
  }, [hasAutoOpened]);

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
        p_selection_from: pendingQuotedText.from,
        p_selection_to: pendingQuotedText.to,
      });

      if (error) {
        toast.error('Error al agregar comentario');
        console.error('Error details:', JSON.stringify(error, null, 2));
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


// ... inside component ...

  // Highlight quoted text using TipTap selection
  function handleHighlightText(quotedText: string, comment: Comment) {
    if (!editor || !quotedText) return;

    // Method 1: Use stored selection indices if available (Most Robust)
    if (typeof comment.selection_from === 'number' && typeof comment.selection_to === 'number') {
      try {
        // Set the selection in the editor
        editor.chain()
          .focus()
          .setTextSelection({ from: comment.selection_from, to: comment.selection_to })
          .run();
          
        // Use a small timeout to allow TipTap to update the DOM
        setTimeout(() => {
          // Get the editor view from TipTap
          const { view } = editor;
          if (!view) return;
          
          // Get the coordinates of the selection start
          const coords = view.coordsAtPos(comment.selection_from!);
          
          // Find the scroll container
          const scrollContainer = editorContainerRef.current?.closest('.overflow-auto');
          
          if (scrollContainer && coords) {
            const containerRect = scrollContainer.getBoundingClientRect();
            // coords.top is relative to viewport, we need to calculate relative to container
            const relativeTop = coords.top - containerRect.top + scrollContainer.scrollTop;
            const targetScroll = relativeTop - 150; // 150px from top for breathing room
            
            scrollContainer.scrollTo({ 
              top: Math.max(0, targetScroll), 
              behavior: 'smooth' 
            });
          }
          
          // Add visual pulse effect using TipTap's Highlight extension
          setTimeout(() => {
            // Apply brand color highlight temporarily (wine/burgundy brand color)
            editor.chain()
              .setTextSelection({ from: comment.selection_from!, to: comment.selection_to! })
              .setHighlight({ color: 'rgba(128, 0, 57, 0.3)' }) 
              .run();
            
            // Remove highlight after 2 seconds
            setTimeout(() => {
              editor.chain()
                .setTextSelection({ from: comment.selection_from!, to: comment.selection_to! })
                .unsetHighlight()
                .run();
              
              // Clear selection
              editor.commands.setTextSelection(comment.selection_to!);
            }, 2000);
          }, 600); // Wait for scroll to mostly finish
          
        }, 50);
        
        return;
      } catch (e) {
        console.warn('Could not set selection by index, falling back to search', e);
      }
    }

    // Fallback
    toast.info('No se pudo ubicar el texto exacto (versión antigua de comentario)');
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
    <div className="flex h-screen overflow-hidden">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b px-6 py-3 flex items-center justify-between bg-card z-10 shrink-0">
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
            <Eye className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Modo solo lectura</span>
            {docData?.allow_comments && (
              <>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-primary/80">Puedes comentar</span>
              </>
            )}
          </p>
          {docData?.allow_comments && (
            <Button 
              variant={showComments ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="relative shadow-sm hover:shadow-md transition-all"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
              {comments.length > 0 && (
                <Badge className="ml-2 bg-primary text-primary-foreground pointer-events-none">
                  {comments.length}
                </Badge>
              )}
            </Button>
          )}
        </header>

        {/* Editor (solo lectura) */}
        <div className="flex-1 overflow-auto bg-muted/30 scrollbar-hide">
          <div ref={editorContainerRef} className="document-paper my-8 transition-transform duration-300">
            <EditorContent
              editor={editor}
              className={`
                prose prose-lg dark:prose-invert max-w-none min-h-[500px]
                prose-headings:font-bold
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-ul:list-disc prose-ul:pl-5
                prose-ol:list-decimal prose-ol:pl-5
              `}
            />
          </div>
        </div>
      </div>

      {/* Text Selection Popup */}
      {hasSelection && selection?.rect && docData?.allow_comments && (
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
      {docData?.allow_comments && (
        <CommentsPanel
          documentId={docData.id}
          isOpen={showComments}
          onToggle={() => setShowComments(!showComments)}
          canComment={docData.access_level === 'comment'}
          onHighlightText={handleHighlightText}
          isPublic={true}
          publicAccessToken={accessToken || undefined}
          onCommentsChange={handleCommentsChange}
          showTrigger={false}
        />
      )}
    </div>
  );
}
