'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useState } from 'react';
import { useDocumentLock } from '@/hooks/useDocumentLock';
import { EditorToolbar } from './EditorToolbar';
import { DocumentLockedBanner } from './DocumentLockedBanner';
import { CommentsPanel } from './CommentsPanel';
import { toast } from 'sonner';

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
      setHasUnsavedChanges(true);
      toast.success('Contenido importado');
    }
  }, [editor, canEdit]);

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
          showComments={showComments}
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
          <div className="max-w-4xl mx-auto px-6 py-8">
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

      {/* Panel de comentarios */}
      {showComments && (
        <CommentsPanel
          documentId={documentId}
          isOpen={showComments}
          onToggle={() => setShowComments(false)}
          canComment={true}
        />
      )}
    </div>
  );
}

