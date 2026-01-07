'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface RestartOrderModalProps {
  order: {
    id: string;
    order_number: string;
    amount: number;
    currency: string;
    signing_document?: {
      id: string;
      status: string;
      signers_count: number;
      signed_count: number;
      title: string;
    } | null;
  };
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestartOrderModal({
  order,
  onSuccess,
  open,
  onOpenChange,
}: RestartOrderModalProps) {
  const [confirmCharge, setConfirmCharge] = useState(false);
  const [loading, setLoading] = useState(false);

  const signersCount = order.signing_document?.signers_count || 0;
  const signedCount = order.signing_document?.signed_count || 0;
  const unitPrice = signersCount > 0 ? order.amount / signersCount : 0;
  const chargedAmount = unitPrice * signedCount;
  const pendingAmount = chargedAmount;

  const handleRestart = async () => {
    if (signedCount > 0 && !confirmCharge) {
      toast.error('Confirmación requerida: Debes confirmar que aceptas el cobro por las firmas ya realizadas.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${order.id}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmCharge: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al reiniciar el pedido');
      }

      toast.success('El proceso de firma ha sido reiniciado exitosamente.');

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: order.currency,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[var(--tp-buttons)]" />
            Reiniciar Proceso de Firma
          </DialogTitle>
          <DialogDescription>
            Esta acción reiniciará todo el proceso de firmas para la orden #{order.order_number}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="warning" className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-400">¿Qué sucederá?</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
              <ul className="list-disc pl-4 space-y-1 mt-2">
                <li>Se invalidarán todas las firmas realizadas hasta ahora.</li>
                <li>Los firmantes recibirán nuevos enlaces de firma.</li>
                <li>El documento volverá a estado de borrador/revisión.</li>
                <li>Se eliminarán los archivos firmados actuales.</li>
              </ul>
            </AlertDescription>
          </Alert>

          {signedCount > 0 && (
            <div className="space-y-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <h4 className="font-medium text-sm">Resumen de Cobro</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Firmas ya realizadas:</span>
                  <span className="font-medium">{signedCount} de {signersCount}</span>
                </div>
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Costo por firmas realizadas:</span>
                  <span className="font-bold">{formatCurrency(chargedAmount)}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t mt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="confirm-charge" 
                    checked={confirmCharge}
                    onCheckedChange={(checked) => setConfirmCharge(checked as boolean)}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="confirm-charge" 
                    className="text-xs leading-normal cursor-pointer"
                  >
                    Entiendo que se me cobrarán {formatCurrency(chargedAmount)} por las firmas ya procesadas y que deberé pagar la diferencia para completar el nuevo proceso.
                  </Label>
                </div>
              </div>
            </div>
          )}

          {signedCount === 0 && (
            <p className="text-sm text-muted-foreground">
              Como no se han realizado firmas aún, el reinicio no tendrá costo adicional.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleRestart} 
            disabled={loading || (signedCount > 0 && !confirmCharge)}
            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reinicio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

