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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface RestartOrderAdminModalProps {
  order: {
    id: string;
    order_number: string;
    amount: number;
    currency: string;
    status: string;
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

export function RestartOrderAdminModal({
  order,
  onSuccess,
  open,
  onOpenChange,
}: RestartOrderAdminModalProps) {
  const [chargeSignatures, setChargeSignatures] = useState('true');
  const [adminNotes, setAdminNotes] = useState('');
  const [confirmNotary, setConfirmNotary] = useState(false);
  const [confirmCompleted, setConfirmCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const signersCount = order.signing_document?.signers_count || 0;
  const signedCount = order.signing_document?.signed_count || 0;
  const docStatus = order.signing_document?.status || '';

  const isInNotary = ['pending_notary', 'notary_observed', 'notarized'].includes(docStatus);
  const isCompleted = docStatus === 'completed' || order.status === 'completed';

  const handleRestart = async () => {
    if (isInNotary && !confirmNotary) {
      toast.error('Confirmación requerida: Debes confirmar que avisaste a la notaría.');
      return;
    }

    if (isCompleted && !confirmCompleted) {
      toast.error('Confirmación requerida: Debes confirmar la autorización de gerencia.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${order.id}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          chargeSignatures: chargeSignatures === 'true',
          adminNotes 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al reiniciar el pedido');
      }

      toast.success('El pedido ha sido reiniciado por el administrador.');

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

  const chargedAmount = signersCount > 0 ? (order.amount / signersCount) * signedCount : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-red-600" />
            Admin: Rehacer Pedido
          </DialogTitle>
          <DialogDescription>
            Reiniciar el proceso de firma para la orden #{order.order_number}. Esta acción es destructiva para el progreso actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Advertencias Críticas */}
          {(isInNotary || isCompleted) && (
            <div className="space-y-3">
              {isInNotary && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Pedido en Notaría</AlertTitle>
                  <AlertDescription className="text-red-700 text-sm">
                    Este documento ya está en proceso notarial.
                    <div className="flex items-center space-x-2 mt-3">
                      <Checkbox 
                        id="confirm-notary" 
                        checked={confirmNotary}
                        onCheckedChange={(checked) => setConfirmNotary(checked as boolean)}
                      />
                      <Label htmlFor="confirm-notary" className="text-xs font-bold cursor-pointer">
                        Confirmo que avisé a la notaría para detener el proceso.
                      </Label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {isCompleted && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">Pedido Finalizado</AlertTitle>
                  <AlertDescription className="text-orange-700 text-sm">
                    El proceso ya se marcó como completado.
                    <div className="flex items-center space-x-2 mt-3">
                      <Checkbox 
                        id="confirm-completed" 
                        checked={confirmCompleted}
                        onCheckedChange={(checked) => setConfirmCompleted(checked as boolean)}
                      />
                      <Label htmlFor="confirm-completed" className="text-xs font-bold cursor-pointer">
                        Confirmo que cuento con aprobación de gerencia para rehacerlo.
                      </Label>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Configuración de Cobro */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-medium text-sm">Configuración de Cobro</h4>
            <RadioGroup value={chargeSignatures} onValueChange={setChargeSignatures} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="charge-true" />
                <Label htmlFor="charge-true" className="text-sm cursor-pointer">
                  Cobrar firmas realizadas ({signedCount} firmas = {formatCurrency(chargedAmount)})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="charge-false" />
                <Label htmlFor="charge-false" className="text-sm cursor-pointer text-green-600 font-medium">
                  Totalmente gratuito (Cortesía)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Notas Administrativas */}
          <div className="space-y-2">
            <Label htmlFor="admin-notes" className="text-sm">Notas Internas (Motivo del reinicio)</Label>
            <Textarea 
              id="admin-notes" 
              placeholder="Ej: Cliente se equivocó en datos de un firmante..." 
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cerrar
          </Button>
          <Button 
            onClick={handleRestart} 
            disabled={loading || (isInNotary && !confirmNotary) || (isCompleted && !confirmCompleted)}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Reiniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

