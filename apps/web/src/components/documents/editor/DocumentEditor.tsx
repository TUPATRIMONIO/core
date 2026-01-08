'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDocumentLock } from '@/hooks/useDocumentLock';
import { useTextSelection } from '@/hooks/useTextSelection';
import { EditorToolbar } from './EditorToolbar';
import { DocumentLockedBanner } from './DocumentLockedBanner';
import { CommentsPanel, type Comment } from './CommentsPanel';
import { TextSelectionPopup } from './TextSelectionPopup';
import { CommentDialog } from './CommentDialog';
import { AIAssistantOverlay } from './AIAssistantOverlay';
import { CommentOnboardingTooltip } from './CommentOnboardingTooltip';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface DocumentEditorProps {
  documentId: string;
  userId: string;
  userName: string;
  initialContent: any;
  initialTitle: string;
  onSave?: (content: any, title: string) => Promise<void>;
}

export function DocumentEditor({
  documentId,
  userId,
  userName,
  initialContent,
  initialTitle,
  onSave,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [pendingQuotedText, setPendingQuotedText] = useState<{ text: string; from: number; to: number } | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSelection, setAISelection] = useState<{ text: string; from: number; to: number } | null>(null);
  const [highlightedText, setHighlightedText] = useState<string | null>(null);
  
  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Sistema de bloqueo
  const { isLocked, lockedBy, canEdit, isConnected } = useDocumentLock({
    documentId,
    userId,
    userName,
  });

  // Configurar editor TipTap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Escribe aquí...',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false, // Prevenir error de SSR en Next.js
    onUpdate: () => {
      setHasUnsavedChanges(true);
    },
  });

  // Actualizar editable cuando cambia el estado del lock
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [canEdit, editor]);

  // Auto-guardado con debounce
  useEffect(() => {
    if (!hasUnsavedChanges || !editor || !canEdit || !onSave) return;

    const timer = setTimeout(async () => {
      await handleSave();
    }, 3000); // 3 segundos de debounce

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, editor, canEdit]);

  // Keyboard shortcuts for AI Assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+Space
      if ((e.metaKey && e.key === 'k') || (e.ctrlKey && e.code === 'Space')) {
        e.preventDefault();
        
        // If there's a selection, use it
        if (editor && !editor.state.selection.empty) {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, ' ');
          setAISelection({ text, from, to });
        } else {
          setAISelection(null);
        }
        
        setShowAIAssistant(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Guardar documento
  const handleSave = useCallback(async () => {
    if (!editor || !onSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(editor.getJSON(), title);
      setHasUnsavedChanges(false);
      toast.success('Documento guardado');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave, title, isSaving]);

  // Manejar importación de contenido (desde Word)
  const handleImportContent = useCallback((html: string) => {
    if (editor && canEdit) {
      editor.commands.setContent(html);
      toast.success('Contenido importado');
    }
  }, [editor, canEdit]);

  // Manejar envío a firma
  const handleSendToSignature = useCallback(async () => {
    // Si hay cambios, guardamos primero
    if (hasUnsavedChanges) {
      await handleSave();
    }
    
    // Redirigir al wizard de firma con el ID del documento
    router.push(`/signing/new?fromDocument=${documentId}`);
  }, [documentId, hasUnsavedChanges, handleSave, router]);

  // Text selection hook for commenting on selected text
  const { selection, hasSelection, clearSelection } = useTextSelection({
    containerRef: editorContainerRef,
    enabled: true,
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

  // Handle AI button from selection
  function handleAddSelectionAI() {
    if (!selection) return;
    
    setAISelection({
      text: selection.text,
      from: selection.from,
      to: selection.to,
    });
    setShowAIAssistant(true);
    clearSelection();
  }

  // Handle AI from toolbar or shortcut
  function handleToggleAI() {
    // If there is an editor selection but we haven't set aiSelection yet, sync it
    if (editor && !editor.state.selection.empty) {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setAISelection({ text, from, to });
    } else {
      setAISelection(null);
    }
    
    setShowAIAssistant(prev => !prev);
  }

  // Submit comment with quoted text (for authenticated users)
  async function handleQuotedCommentSubmit(content: string) {
    if (!pendingQuotedText) return;

    try {
      const { data, error } = await supabase.rpc('add_document_comment', {
        p_document_id: documentId,
        p_content: content,
        p_quoted_text: pendingQuotedText.text,
        p_selection_from: pendingQuotedText.from,
        p_selection_to: pendingQuotedText.to,
      });

      if (error) {
        console.error('Error adding comment:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error),
        });
        toast.error(error.message || 'Error al agregar comentario');
        throw error;
      }

      setPendingQuotedText(null);
      setShowComments(true); // Open comments panel to see the new comment
      toast.success('Comentario agregado');
    } catch (error: any) {
      console.error('Catch error:', error);
      toast.error(error?.message || 'Error al agregar comentario');
      throw error;
    }
  }

  // Highlight quoted text in the document when clicking on a comment
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
          
        setTimeout(() => {
          const { view } = editor;
          if (!view) return;
          
          const coords = view.coordsAtPos(comment.selection_from!);
          const scrollContainer = editorContainerRef.current?.closest('.overflow-auto');
          
          if (scrollContainer && coords) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const relativeTop = coords.top - containerRect.top + scrollContainer.scrollTop;
            const targetScroll = relativeTop - 150;
            
            scrollContainer.scrollTo({ 
              top: Math.max(0, targetScroll), 
              behavior: 'smooth' 
            });
          }
          
          // Visual pulse effect using Highlights
          setTimeout(() => {
            editor.chain()
              .setTextSelection({ from: comment.selection_from!, to: comment.selection_to! })
              .setHighlight({ color: 'rgba(128, 0, 57, 0.3)' }) 
              .run();
            
            setTimeout(() => {
              editor.chain()
                .setTextSelection({ from: comment.selection_from!, to: comment.selection_to! })
                .unsetHighlight()
                .run();
              editor.commands.setTextSelection(comment.selection_to!);
            }, 2000);
          }, 600);
        }, 50);
        
        return;
      } catch (e) {
        console.warn('Could not set selection by index, falling back to search', e);
      }
    }

    // Fallback Method 2: Manual search using window.find (less reliable)
    if (editorContainerRef.current) {
      editorContainerRef.current.focus();
      // @ts-ignore
      const found = window.find(quotedText, false, false, true, false, true, false);
      if (found) {
        toast.info('Texto encontrado - revisa la selección');
      } else {
        toast.info('El texto citado ya no existe en el documento');
      }
    }
  }

  // Handler para hacer clic en cualquier parte del papel y activar el editor
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo procesar si el editor existe y se puede editar
    if (!editor || !canEdit) return;

    const target = e.target as HTMLElement;
    
    // No hacer nada si el clic fue en un elemento interactivo (enlaces, botones, etc.)
    if (target.closest('a, button, [role="button"]')) {
      return;
    }

    // Si el clic fue directamente en el contenedor del papel o en el área del editor
    // hacer focus al editor para permitir escribir
    if (target === editorContainerRef.current || target.closest('.ProseMirror')) {
      // Pequeño delay para asegurar que TipTap procese el evento primero
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          // Si el editor está vacío, colocar cursor al inicio
          // Si tiene contenido, colocar al final
          if (editor.isEmpty) {
            editor.commands.focus('start');
          } else {
            editor.commands.focus('end');
          }
        }
      }, 10);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Banner de documento bloqueado */}
        {isLocked && lockedBy && (
          <DocumentLockedBanner 
            lockedBy={lockedBy.name} 
            isConnected={isConnected}
          />
        )}

        {/* Toolbar */}
        <EditorToolbar
          editor={editor}
          documentId={documentId}
          isSaving={isSaving}
          hasChanges={hasUnsavedChanges}
          canEdit={canEdit}
          isConnected={isConnected}
          onSave={handleSave}
          onImportContent={handleImportContent}
          onToggleComments={() => setShowComments(!showComments)}
          onToggleAI={handleToggleAI}
          onSendToSignature={handleSendToSignature}
          showComments={showComments}
          showAI={showAIAssistant}
        />

        {/* Título para identificar el documento (fuera del papel) */}
        <div className="border-b px-6 py-3 bg-card">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            disabled={!canEdit}
            placeholder="Título del documento (solo para identificación)"
            className="w-full text-lg font-medium bg-transparent border-none outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Editor de contenido */}
        <div className="flex-1 overflow-auto document-background">
          <div 
            ref={editorContainerRef} 
            className="document-paper"
            onClick={handlePaperClick}
          >
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
                ${!canEdit ? 'opacity-75 cursor-not-allowed' : ''}
              `}
            />
          </div>
        </div>
      </div>

      {/* Text Selection Popup */}
      {hasSelection && selection?.rect && (
        <TextSelectionPopup
          position={{ top: selection.rect.top, left: selection.rect.left + selection.rect.width / 2 }}
          onAddComment={handleAddSelectionComment}
          onAIDevelop={handleAddSelectionAI}
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
      <CommentOnboardingTooltip />

      {/* AI Assistant Overlay */}
      <AIAssistantOverlay
        editor={editor}
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        selection={aiSelection}
        documentId={documentId}
      />

      {/* Panel de comentarios */}
      {showComments && (
        <CommentsPanel
          documentId={documentId}
          isOpen={showComments}
          onToggle={() => setShowComments(false)}
          canComment={true}
          onHighlightText={handleHighlightText}
        />
      )}
    </div>
  );
}

