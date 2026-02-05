'use client';

// =====================================================
// Component: SyncVerificationsButton
// Description: Botón para importar verificaciones de Veriff por ID
// =====================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SyncVerificationsButtonProps {
  organizationId?: string;
}

export function SyncVerificationsButton({ organizationId }: SyncVerificationsButtonProps) {
  const [open, setOpen] = useState(false);
  const [sessionIds, setSessionIds] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    if (!sessionIds.trim()) {
      toast.error('Ingresa al menos un ID de sesión de Veriff');
      return;
    }

    setSyncing(true);
    setResult(null);

    try {
      // Separar IDs por coma, salto de línea o espacio
      const ids = sessionIds
        .split(/[,\n\s]+/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      console.log('Importando IDs:', ids, 'Org:', organizationId);

      const response = await fetch('/api/admin/sync-verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: ids, organizationId }),
      });

      const data = await response.json();
      console.log('Respuesta sync:', data);

      if (!response.ok) {
        const errorMsg = data.details || data.error || 'Error en la importación';
        setResult(`Error: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Mostrar resultados detallados
      const resultParts: string[] = [];
      if (data.imported > 0) resultParts.push(`${data.imported} importada(s)`);
      if (data.skipped > 0) resultParts.push(`${data.skipped} ya existente(s)`);
      if (data.errors > 0) resultParts.push(`${data.errors} error(es)`);

      const msg = resultParts.length > 0 ? resultParts.join(', ') : 'Sin resultados';

      // Si hay errores detallados, mostrarlos
      if (data.results) {
        const errorResults = data.results.filter((r: any) => r.status === 'error');
        if (errorResults.length > 0) {
          const errorDetails = errorResults.map((r: any) => `${r.id}: ${r.reason}`).join('\n');
          setResult(`${msg}\n\nDetalles de errores:\n${errorDetails}`);
          toast.error(msg);
        } else {
          setResult(msg);
          toast.success(msg);
        }
      } else {
        toast.success(msg);
      }

      if (data.imported > 0) {
        // Cerrar y recargar solo si se importó algo
        setTimeout(() => {
          setOpen(false);
          setSessionIds('');
          setResult(null);
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error importando:', error);
      toast.error(error.message || 'Error al importar verificaciones');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Importar de Veriff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Verificaciones de Veriff</DialogTitle>
          <DialogDescription>
            Ingresa los IDs de sesión de Veriff que quieres importar.
            Los puedes encontrar en el Dashboard de Veriff.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">IDs de Sesión de Veriff</label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Pega uno o varios IDs, separados por coma o salto de línea"
              value={sessionIds}
              onChange={(e) => setSessionIds(e.target.value)}
              disabled={syncing}
            />
            <p className="text-xs text-muted-foreground">
              Ejemplo: c5f73e02-4f61-4f2c-a7fc-f1cebc64d7dc
            </p>
          </div>
          {result && (
            <div className={`rounded-md p-3 text-sm whitespace-pre-wrap ${result.startsWith('Error') ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'}`}>
              {result}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSync} disabled={syncing || !sessionIds.trim()}>
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
