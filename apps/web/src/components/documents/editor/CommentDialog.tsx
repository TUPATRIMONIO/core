'use client';

import { useState } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotedText: string;
  onSubmit: (content: string) => Promise<void>;
}

/**
 * Modal para escribir un comentario sobre texto seleccionado
 */
export function CommentDialog({
  open,
  onOpenChange,
  quotedText,
  onSubmit,
}: CommentDialogProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Truncar texto citado si es muy largo
  const displayQuote = quotedText.length > 150 
    ? quotedText.slice(0, 150) + '...' 
    : quotedText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar comentario</DialogTitle>
          <DialogDescription>
            Comenta sobre el texto seleccionado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Texto citado */}
          <div className="border-l-4 border-primary/50 pl-3 py-2 bg-muted/50 rounded-r">
            <p className="text-sm italic text-muted-foreground">
              "{displayQuote}"
            </p>
          </div>

          {/* Input de comentario */}
          <Textarea
            placeholder="Escribe tu comentario..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] resize-none"
            autoFocus
          />

          {/* Hint de atajo de teclado */}
          <p className="text-xs text-muted-foreground">
            Presiona <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> + 
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Enter</kbd> para enviar
          </p>

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Comentar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
