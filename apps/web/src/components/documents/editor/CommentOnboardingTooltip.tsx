'use client';

import { useState, useEffect } from 'react';
import { X, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'comment_onboarding_dismissed';

interface CommentOnboardingTooltipProps {
  className?: string;
}

/**
 * Tooltip de onboarding que explica cómo usar los comentarios en fragmentos de texto.
 * Solo se muestra una vez y se guarda en localStorage.
 */
export function CommentOnboardingTooltip({ className }: CommentOnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar si no ha sido descartado antes
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Pequeño delay para que la animación se vea suave
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in-0 duration-300",
        className
      )}
    >
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios en texto
            </h4>
            <p className="text-sm text-muted-foreground">
              <strong>Selecciona cualquier fragmento de texto</strong> y haz clic en el 
              botón <span className="inline-flex items-center gap-0.5 text-primary">"Comentar"</span> que 
              aparece para agregar comentarios contextuales.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  );
}
