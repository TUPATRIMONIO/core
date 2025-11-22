'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Star, StarOff, CreditCard, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
  id: string;
  type: string;
  provider: 'stripe' | 'dlocal';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

interface PaymentMethodsListProps {
  initialMethods: PaymentMethod[];
}

export function PaymentMethodsList({ initialMethods }: PaymentMethodsListProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSetDefault = async (methodId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/billing/payment-methods/${methodId}/default`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al actualizar método predeterminado');
        }

        // Actualizar estado local
        setMethods(prev =>
          prev.map(m =>
            m.id === methodId
              ? { ...m, is_default: true }
              : { ...m, is_default: false }
          )
        );

        // Método predeterminado actualizado
        router.refresh();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al actualizar método predeterminado');
      }
    });
  };

  const handleDelete = async (methodId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/billing/payment-methods/${methodId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al eliminar método de pago');
        }

        // Remover de estado local
        setMethods(prev => prev.filter(m => m.id !== methodId));

        // Método de pago eliminado
        router.refresh();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al eliminar método de pago');
      }
    });
  };

  const getCardBrandIcon = (brand?: string) => {
    return <CreditCard className="h-5 w-5" />;
  };

  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return null;
    return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
  };

  if (methods.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No hay métodos de pago guardados</p>
        <p className="text-sm text-muted-foreground">
          Agrega un método de pago para facilitar tus compras
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((method) => (
        <Card key={method.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                  {getCardBrandIcon(method.brand)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {method.brand
                        ? `${method.brand.toUpperCase()} •••• ${method.last4 || '****'}`
                        : 'Método de pago'}
                    </p>
                    {method.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Predeterminado
                      </Badge>
                    )}
                  </div>
                  {method.exp_month && method.exp_year && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Expira {formatExpiry(method.exp_month, method.exp_year)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Agregado el {new Date(method.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleSetDefault(method.id)}
                    disabled={isPending}
                    title="Marcar como predeterminado"
                  >
                    <StarOff className="h-4 w-4" />
                  </Button>
                )}
                {method.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    title="Método predeterminado"
                  >
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      title="Eliminar método de pago"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar método de pago?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El método de pago será eliminado
                        permanentemente de tu cuenta.
                        {method.is_default && (
                          <span className="block mt-2 font-semibold text-foreground">
                            Este es tu método predeterminado. Se seleccionará automáticamente
                            otro método si existe.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(method.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Eliminando...
                          </>
                        ) : (
                          'Eliminar'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

