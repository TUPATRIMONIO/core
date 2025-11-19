'use client';

/**
 * FloatingSaveButton
 * Botón flotante para guardar cambios pendientes
 */

import { Button } from '@/components/ui/button';
import { Save, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface FloatingSaveButtonProps {
  show: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  changesCount?: number;
}

export function FloatingSaveButton({
  show,
  saving,
  onSave,
  onCancel,
  changesCount = 0
}: FloatingSaveButtonProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="border-2 border-[var(--tp-brand)] shadow-2xl">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-sm">Cambios pendientes</p>
              <p className="text-xs text-muted-foreground">
                {changesCount} campo{changesCount !== 1 ? 's' : ''} modificado{changesCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={saving}
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="bg-[var(--tp-brand)] hover:bg-[var(--tp-brand-light)]"
              >
                {saving ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Save className="w-3 h-3 mr-1" />
                )}
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

