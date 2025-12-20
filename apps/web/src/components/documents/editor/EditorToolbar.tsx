'use client';

import { Editor } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code,
  Heading1, Heading2, Heading3,
  Link as LinkIcon, Highlighter,
  Undo, Redo,
  Save, Cloud, CloudOff, Upload, Loader2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { WordImporter } from './WordImporter';
import { ShareDocumentDialog } from '@/components/documents/ShareDocumentDialog';

interface EditorToolbarProps {
  editor: Editor | null;
  documentId: string;
  isSaving: boolean;
  hasChanges: boolean;
  canEdit: boolean;
  isConnected: boolean;
  onSave: () => void;
  onImportContent: (html: string) => void;
  onToggleComments: () => void;
  showComments: boolean;
}

export function EditorToolbar({
  editor,
  documentId,
  isSaving,
  hasChanges,
  canEdit,
  isConnected,
  onSave,
  onImportContent,
  onToggleComments,
  showComments,
}: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-2 border-b bg-card flex-wrap">
        {/* Undo/Redo */}
        <ToolbarButton
          icon={Undo}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!canEdit || !editor.can().undo()}
          tooltip="Deshacer"
        />
        <ToolbarButton
          icon={Redo}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!canEdit || !editor.can().redo()}
          tooltip="Rehacer"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <ToolbarButton
          icon={Heading1}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          disabled={!canEdit}
          tooltip="Título 1"
        />
        <ToolbarButton
          icon={Heading2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          disabled={!canEdit}
          tooltip="Título 2"
        />
        <ToolbarButton
          icon={Heading3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          disabled={!canEdit}
          tooltip="Título 3"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Formato de texto */}
        <ToolbarButton
          icon={Bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={!canEdit}
          tooltip="Negrita (Ctrl+B)"
        />
        <ToolbarButton
          icon={Italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={!canEdit}
          tooltip="Cursiva (Ctrl+I)"
        />
        <ToolbarButton
          icon={Underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          disabled={!canEdit}
          tooltip="Subrayado (Ctrl+U)"
        />
        <ToolbarButton
          icon={Strikethrough}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          disabled={!canEdit}
          tooltip="Tachado"
        />
        <ToolbarButton
          icon={Highlighter}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          disabled={!canEdit}
          tooltip="Resaltar"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alineación */}
        <ToolbarButton
          icon={AlignLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          disabled={!canEdit}
          tooltip="Alinear izquierda"
        />
        <ToolbarButton
          icon={AlignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          disabled={!canEdit}
          tooltip="Centrar"
        />
        <ToolbarButton
          icon={AlignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          disabled={!canEdit}
          tooltip="Alinear derecha"
        />
        <ToolbarButton
          icon={AlignJustify}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          disabled={!canEdit}
          tooltip="Justificar"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Listas */}
        <ToolbarButton
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          disabled={!canEdit}
          tooltip="Lista con viñetas"
        />
        <ToolbarButton
          icon={ListOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          disabled={!canEdit}
          tooltip="Lista numerada"
        />

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Bloques */}
        <ToolbarButton
          icon={Quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          disabled={!canEdit}
          tooltip="Cita"
        />
        <ToolbarButton
          icon={Code}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          disabled={!canEdit}
          tooltip="Bloque de código"
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Importar Word */}
        {canEdit && (
          <WordImporter onImport={onImportContent} />
        )}

        {/* Compartir */}
        {canEdit && (
          <ShareDocumentDialog documentId={documentId} />
        )}

        {/* Comentarios */}
        <Button
          variant={showComments ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleComments}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Comentarios
        </Button>

        {/* Guardar */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {hasChanges ? 'Guardar' : 'Guardado'}
          </Button>
        )}

        {/* Estado de conexión */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`p-2 rounded ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isConnected ? 'Conectado' : 'Sin conexión'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
}

function ToolbarButton({ 
  icon: Icon, 
  onClick, 
  isActive, 
  disabled, 
  tooltip 
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
