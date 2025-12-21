'use client';

import { MessageSquarePlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TextSelectionPopupProps {
  position: { top: number; left: number } | null;
  onAddComment: () => void;
  onAIDevelop?: () => void;
  className?: string;
}

/**
 * Botón flotante que aparece cerca del texto seleccionado
 * para permitir agregar un comentario a esa selección o usar IA
 */
export function TextSelectionPopup({ 
  position, 
  onAddComment,
  onAIDevelop,
  className 
}: TextSelectionPopupProps) {
  if (!position) return null;

  return (
    <div
      data-comment-popup
      className={cn(
        "fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200 flex items-center bg-background rounded-md shadow-lg border p-1 gap-1",
        className
      )}
      style={{
        top: position.top - 45,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 gap-1.5 hover:bg-muted"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddComment();
        }}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="text-xs">Comentar</span>
      </Button>

      {onAIDevelop && (
        <>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 gap-1.5 hover:bg-primary/10 hover:text-primary group"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAIDevelop();
            }}
          >
            <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
            <span className="text-xs">Usar IA</span>
          </Button>
        </>
      )}
    </div>
  );
}
