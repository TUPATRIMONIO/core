'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, XCircle, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order } from '@/lib/checkout/core';
import { OneclickCardsList, type OneclickCard } from './OneclickCardsList';

interface OrderCheckoutFormProps {
  orderId: string;
  order: Order;
  provider: 'transbank' | 'stripe';
}

export default function OrderCheckoutForm({
  orderId,
  order,
  provider,
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'webpay' | 'oneclick'>('webpay');
  const [oneclickTbkUser, setOneclickTbkUser] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<OneclickCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [loadingCards, setLoadingCards] = useState(true);

  // Cargar tarjetas guardadas
  useEffect(() => {
    const loadCards = async () => {
      try {
        // Cargar tarjetas guardadas
        const cardsResponse = await fetch('/api/transbank/oneclick/cards');
        if (cardsResponse.ok) {
          const cardsData = await cardsResponse.json();
          setSavedCards(cardsData.cards || []);
          
          // Seleccionar tarjeta predeterminada si existe
          const defaultCard = cardsData.cards?.find((c: OneclickCard) => c.is_default);
          if (defaultCard) {
            setSelectedCardId(defaultCard.id);
            setOneclickTbkUser(defaultCard.provider_payment_method_id);
          }
        }
      } catch (err) {
        console.error('Error cargando tarjetas:', err);
      } finally {
        setLoadingCards(false);
      }
    };

    loadCards();
  }, []);

  // Detectar si el usuario regresó de una inscripción Oneclick exitosa
  useEffect(() => {
    const tbkToken = searchParams.get('TBK_TOKEN');
    const type = searchParams.get('type');
    
    if (tbkToken && type === 'oneclick_inscription') {
      // Obtener datos de la inscripción desde la API
      fetch(`/api/transbank/oneclick/inscription/finish?token=${tbkToken}`, {
        method: 'POST',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tbkUser) {
            // Mostrar error si hubo problema guardando
            if (data.saveError) {
              console.error('⚠️ Error guardando tarjeta:', data.saveError);
              setError(`Inscripción exitosa pero hubo un problema guardando la tarjeta: ${data.saveError}`);
            }
            
            setOneclickTbkUser(data.tbkUser);
            setActiveTab('oneclick');
            setShowAddCardForm(false);
            // Recargar tarjetas
            fetch('/api/transbank/oneclick/cards')
              .then(res => res.json())
              .then(cardsData => {
                setSavedCards(cardsData.cards || []);
                // Seleccionar la tarjeta recién creada si existe
                const newCard = cardsData.cards?.find(
                  (c: OneclickCard) => c.provider_payment_method_id === data.tbkUser
                );
                if (newCard) {
                  setSelectedCardId(newCard.id);
                }
              });
            // Limpiar URL
            router.replace(window.location.pathname, { scroll: false });
          }
        })
        .catch(err => {
          console.error('Error obteniendo datos de inscripción:', err);
          setError(`Error procesando inscripción: ${err.message}`);
        });
    }
  }, [searchParams, router]);

  /**
   * Función unificada para manejar checkout con cualquier proveedor
   */
  const handleCheckout = async (provider: 'stripe' | 'transbank') => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/checkout/${orderId}/success?provider=${provider}`;
      
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          provider,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando pago');
      }

      // Transbank requiere formulario POST con token_ws
      if (provider === 'transbank' && data.url && data.sessionId) {
        // Normalizar URL: remover puerto :443 explícito si está presente
        let normalizedUrl = data.url;
        try {
          const urlObj = new URL(data.url);
          if (urlObj.port === '443') {
            urlObj.port = '';
            normalizedUrl = urlObj.toString();
          }
        } catch (e) {
          console.error('[OrderCheckoutForm] Error normalizando URL:', e);
        }
        
        // Crear formulario POST oculto según documentación de Transbank
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = normalizedUrl;
        form.style.display = 'none';
        form.setAttribute('accept-charset', 'UTF-8');
        
        // Agregar campo token_ws requerido por Transbank
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = data.sessionId; // sessionId es el token en Transbank
        form.appendChild(tokenInput);
        
        // Agregar formulario al DOM y auto-enviarlo
        document.body.appendChild(form);
        setTimeout(() => {
          form.submit();
        }, 100);
      } else {
        // Stripe y otros proveedores: redirección simple
        window.location.href = data.url;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleWebpayPlus = async () => {
    await handleCheckout('transbank');
  };

  const handleOneclickInscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/checkout/${orderId}?type=oneclick_inscription`;
      
      const response = await fetch('/api/transbank/oneclick/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          returnUrl, // username se maneja automáticamente en el servidor con user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error iniciando inscripción');
      }

      // Redirigir a Transbank usando formulario POST con token
      if (data.url && data.token) {
        // Crear formulario POST oculto según documentación de Transbank
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        
        // Agregar campo TBK_TOKEN requerido por Transbank Oneclick
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'TBK_TOKEN';
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        
        // Agregar formulario al DOM y auto-enviarlo
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error('No se recibió URL o token de redirección');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar inscripción';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOneclickPayment = async () => {
    // Obtener tbkUser de la tarjeta seleccionada o del estado actual
    let tbkUserToUse = oneclickTbkUser;

    if (selectedCardId) {
      const selectedCard = savedCards.find(c => c.id === selectedCardId);
      if (selectedCard) {
        tbkUserToUse = selectedCard.provider_payment_method_id;
      }
    }

    if (!tbkUserToUse) {
      setError('Primero debes seleccionar o inscribir una tarjeta');
      return;
    }

    // Obtener user.id para el username
    const userResponse = await fetch('/api/auth/user');
    if (!userResponse.ok) {
      setError('Error obteniendo información del usuario');
      return;
    }
    const userData = await userResponse.json();
    const usernameToUse = userData.id;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transbank/oneclick/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          tbkUser: tbkUserToUse,
          username: usernameToUse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando pago');
      }

      // El pago Oneclick se autoriza directamente, no hay redirección
      if (data.success) {
        // Pago autorizado exitosamente - pasar el token (buy_order) en la URL
        const token = data.token || '';
        router.push(`/checkout/${orderId}/success?provider=transbank&method=oneclick&token_ws=${encodeURIComponent(token)}`);
      } else {
        // Pago rechazado o error
        const errorMsg = data.paymentStatus === 'rejected' 
          ? 'El pago fue rechazado. Por favor intenta con otra tarjeta o método de pago.'
          : 'Error procesando el pago con Oneclick';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    const selectedCard = savedCards.find(c => c.id === cardId);
    if (selectedCard) {
      setOneclickTbkUser(selectedCard.provider_payment_method_id);
    }
  };

  const handleCardDeleted = async () => {
    // Recargar tarjetas
    const cardsResponse = await fetch('/api/transbank/oneclick/cards');
    if (cardsResponse.ok) {
      const cardsData = await cardsResponse.json();
      setSavedCards(cardsData.cards || []);
      
      // Si se eliminó la tarjeta seleccionada, limpiar selección
      if (!cardsData.cards?.find((c: OneclickCard) => c.id === selectedCardId)) {
        setSelectedCardId(null);
        setOneclickTbkUser(null);
      }
    }
  };

  const handleStripePayment = async () => {
    await handleCheckout('stripe');
  };

  // Si es Stripe, mostrar componente simple
  if (provider === 'stripe') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pago con Stripe</CardTitle>
          <CardDescription>
            Completa el pago con tu tarjeta de crédito o débito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.amount)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleStripePayment}
            disabled={loading}
            className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar con Stripe
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Para Transbank, mostrar tabs con Webpay Plus y Oneclick
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'webpay' | 'oneclick')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="webpay">Webpay Plus</TabsTrigger>
          <TabsTrigger value="oneclick">Oneclick</TabsTrigger>
        </TabsList>

        {/* Tab Webpay Plus */}
        <TabsContent value="webpay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pago con Webpay Plus</CardTitle>
              <CardDescription>
                Serás redirigido a Transbank para completar el pago de forma segura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total a pagar</span>
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(order.amount)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleWebpayPlus}
                disabled={loading}
                className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pagar con Webpay Plus
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Al hacer clic, serás redirigido a Transbank para completar el pago de forma segura
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Oneclick */}
        <TabsContent value="oneclick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pago con Oneclick</CardTitle>
              <CardDescription>
                Guarda tu tarjeta para pagos rápidos y seguros
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loadingCards ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : savedCards.length > 0 && !showAddCardForm ? (
                <>
                  <div className="space-y-3">
                    <OneclickCardsList
                      cards={savedCards}
                      selectedCardId={selectedCardId || undefined}
                      onCardSelect={handleCardSelect}
                      onCardDeleted={handleCardDeleted}
                      showActions={true}
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setShowAddCardForm(true)}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar otra tarjeta
                  </Button>

                  <div className="rounded-lg border p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total a pagar</span>
                      <span className="text-2xl font-bold">
                        {new Intl.NumberFormat('es-CL', {
                          style: 'currency',
                          currency: order.currency,
                        }).format(order.amount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleOneclickPayment}
                    disabled={loading || !selectedCardId}
                    className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar con Oneclick
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      Serás redirigido a Transbank para inscribir tu tarjeta de forma segura.
                      Podrás usarla para pagos rápidos en el futuro.
                    </AlertDescription>
                  </Alert>

                  {savedCards.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCardForm(false)}
                      className="w-full"
                    >
                      Cancelar
                    </Button>
                  )}

                  <Button
                    onClick={handleOneclickInscription}
                    disabled={loading}
                    className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Guardar Tarjeta
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

