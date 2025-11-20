'use client';

/**
 * usePendingChanges Hook
 * Gestiona cambios pendientes con botón flotante de guardar
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface UsePendingChangesOptions {
  onSave: (changes: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
}

interface UsePendingChangesReturn {
  pendingChanges: Record<string, any>;
  hasPendingChanges: boolean;
  saving: boolean;
  updateField: (key: string, value: any) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
  getFieldValue: (key: string) => any;
}

export function usePendingChanges({
  onSave,
  initialData = {}
}: UsePendingChangesOptions): UsePendingChangesReturn {
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updateField = useCallback((key: string, value: any) => {
    setPendingChanges(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const saveChanges = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    setSaving(true);
    try {
      await onSave(pendingChanges);
      setPendingChanges({});
      toast({
        title: 'Cambios guardados',
        description: 'Los cambios se guardaron correctamente',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [pendingChanges, onSave, toast]);

  const resetChanges = useCallback(() => {
    setPendingChanges({});
  }, []);

  const getFieldValue = useCallback((key: string) => {
    return pendingChanges.hasOwnProperty(key) ? pendingChanges[key] : initialData[key];
  }, [pendingChanges, initialData]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return {
    pendingChanges,
    hasPendingChanges,
    saving,
    updateField,
    saveChanges,
    resetChanges,
    getFieldValue
  };
}

