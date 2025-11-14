/**
 * Toast Hook
 * Sistema de notificaciones toast
 */

import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    const id = `toast-${Date.now()}-${toastCounter++}`;
    
    const newToast: Toast = {
      id,
      title,
      description,
      variant
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    // Mostrar en console por ahora (puedes agregar UI después)
    if (variant === 'destructive') {
      console.error(`❌ ${title}`, description);
    } else {
      console.log(`✅ ${title}`, description);
    }
  }, []);

  return { toast, toasts };
}







