'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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

export interface OneclickCard {
  id: string;
  provider_payment_method_id: string; // tbkUser
  brand?: string; // card_type
  last4?: string; // últimos 4 dígitos
  is_default: boolean;
  created_at: string;
  metadata?: {
    username?: string;
    authorization_code?: string;
    card_type?: string;
    card_number?: string;
  };
}

interface OneclickCardsListProps {
  cards: OneclickCard[];
  selectedCardId?: string;
  onCardSelect?: (cardId: string) => void;
  onCardDeleted?: () => void;
  showActions?: boolean; // Si mostrar botones de eliminar/marcar default
}

export function OneclickCardsList({
  cards,
  selectedCardId,
  onCardSelect,
  onCardDeleted,
  showActions = true,
}: OneclickCardsListProps) {
  const [isPending, startTransition] = useTransition();
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  const handleSetDefault = async (cardId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/transbank/oneclick/cards/${cardId}/default`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al marcar tarjeta como predeterminada');
        }

        // Si hay callback, ejecutarlo para refrescar la lista
        onCardDeleted?.();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al marcar tarjeta como predeterminada');
        alert(error.message || 'Error al marcar tarjeta como predeterminada');
      }
    });
  };

  const handleDelete = async (cardId: string) => {
    setDeletingCardId(cardId);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/transbank/oneclick/cards/${cardId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al eliminar tarjeta');
        }

        // Si hay callback, ejecutarlo para refrescar la lista
        onCardDeleted?.();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al eliminar tarjeta');
        alert(error.message || 'Error al eliminar tarjeta');
      } finally {
        setDeletingCardId(null);
      }
    });
  };

  const getCardBrandName = (brand?: string) => {
    if (!brand) return 'Tarjeta';
    const brandMap: Record<string, string> = {
      Visa: 'Visa',
      MasterCard: 'Mastercard',
      AmericanExpress: 'American Express',
      Diners: 'Diners Club',
      Magna: 'Magna',
      Redcompra: 'Redcompra',
      Prepago: 'Prepago',
    };
    return brandMap[brand] || brand;
  };

  if (cards.length === 0) {
    return null; // No mostrar nada si no hay tarjetas
  }

  // Si hay una tarjeta seleccionada por defecto, usarla
  const defaultSelected = selectedCardId || cards.find(c => c.is_default)?.id || cards[0]?.id;

  return (
    <RadioGroup
      value={selectedCardId || defaultSelected}
      onValueChange={onCardSelect}
      className="space-y-3"
    >
      {cards.map((card) => {
        const cardBrand = card.brand || card.metadata?.card_type;
        const cardLast4 = card.last4 || card.metadata?.card_number;

        return (
          <Card key={card.id} className={selectedCardId === card.id ? 'ring-2 ring-[var(--tp-buttons)]' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <RadioGroupItem value={card.id} id={card.id} className="mt-1" />
                <Label
                  htmlFor={card.id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {cardBrand
                              ? `${getCardBrandName(cardBrand)} •••• ${cardLast4 || '****'}`
                              : 'Tarjeta OneClick'}
                          </p>
                          {card.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Predeterminada
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Tarjeta personal guardada
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agregada el {new Date(card.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    {showActions && (
                      <div className="flex items-center gap-2">
                        {!card.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(card.id);
                            }}
                            disabled={isPending}
                            title="Marcar como predeterminada"
                            className="h-8 w-8"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        {card.is_default && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            title="Tarjeta predeterminada"
                            className="h-8 w-8"
                          >
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending || deletingCardId === card.id}
                              title="Eliminar tarjeta"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deletingCardId === card.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar tarjeta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará la tarjeta de Transbank y de tu cuenta.
                                Esta acción no se puede deshacer.
                                {card.is_default && (
                                  <span className="block mt-2 font-semibold text-foreground">
                                    Esta es tu tarjeta predeterminada. Se seleccionará automáticamente
                                    otra tarjeta si existe.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(card.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                {isPending && deletingCardId === card.id ? (
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
                    )}
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </RadioGroup>
  );
}

