'use client';

import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TextSelectionPopupProps {
  position: { top: number; left: number } | null;
  onAddComment: () => void;
  className?: string;
}

/**
 * Botón flotante que aparece cerca del texto seleccionado
 * para permitir agregar un comentario a esa selección
 */
export function TextSelectionPopup({ 
  position, 
  onAddComment,
  className 
}: TextSelectionPopupProps) {
  if (!position) return null;

  return (
    <div
      data-comment-popup
      className={cn(
        "fixed z-50 animate-in fade-in-0 zoom-in-95 duration-200",
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
        variant="default"
        className="shadow-lg gap-1.5 h-8 px-3"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddComment();
        }}
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span className="text-xs">Comentar</span>
      </Button>
    </div>
  );
}
