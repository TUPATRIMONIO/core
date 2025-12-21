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
import { CommentsPanel } from './CommentsPanel';
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
    router.push(`/dashboard/signing/documents/new?fromDocument=${documentId}`);
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
  function handleHighlightText(quotedText: string) {
    if (!editorContainerRef.current || !quotedText) {
      console.log('handleHighlightText: missing ref or text', { hasRef: !!editorContainerRef.current, quotedText });
      return;
    }

    console.log('handleHighlightText: searching for', quotedText);

    // Add animation keyframes if not already present
    if (!document.getElementById('comment-highlight-styles')) {
      const style = document.createElement('style');
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
      document.head.appendChild(style);
    }

    // Method 1: Use window.find() to locate and select the text
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    // Focus on the editor container first
    editorContainerRef.current.focus();

    // Try to find the text using window.find (works in most browsers)
    // @ts-ignore - window.find is not in TypeScript types but exists in browsers
    const found = window.find(quotedText, false, false, true, false, true, false);

    if (found && selection && selection.rangeCount > 0) {
      console.log('handleHighlightText: found text with window.find');
      const range = selection.getRangeAt(0);
      
      // Scroll the selection into view
      const rect = range.getBoundingClientRect();
      const scrollContainer = editorContainerRef.current.closest('.overflow-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const scrollTop = scrollContainer.scrollTop + rect.top - containerRect.top - 150;
        scrollContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
      }

      // Create highlight span
      try {
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'comment-highlight-active';
        range.surroundContents(highlightSpan);

        // Remove highlight after animation
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
        console.log('Could not wrap text, using selection highlight');
        // Keep selection visible for a moment
        setTimeout(() => {
          selection?.removeAllRanges();
        }, 2000);
      }
    } else {
      console.log('handleHighlightText: text not found with window.find, trying manual search');
      
      // Fallback: Manual search in text content
      const editorText = editorContainerRef.current.textContent || '';
      if (editorText.includes(quotedText)) {
        toast.info('Texto encontrado - revisa el documento');
        // Simple scroll to top of editor as fallback
        const scrollContainer = editorContainerRef.current.closest('.overflow-auto');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        toast.info('El texto citado ya no existe en el documento');
      }
    }
  }


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

        {/* Título editable */}
        <div className="border-b px-6 py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setHasUnsavedChanges(true);
            }}
            disabled={!canEdit}
            placeholder="Título del documento"
            className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {/* Editor de contenido */}
        <div className="flex-1 overflow-auto">
          <div ref={editorContainerRef} className="max-w-4xl mx-auto px-6 py-8">
            <EditorContent
              editor={editor}
              className={`
                prose prose-lg dark:prose-invert max-w-none min-h-[500px]
                prose-headings:font-bold
                prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                prose-p:leading-relaxed
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
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

