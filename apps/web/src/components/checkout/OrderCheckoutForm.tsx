'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, XCircle, Plus, Info, CheckCircle, Gift } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order } from '@/lib/checkout/core';
import type { PaymentConfig } from '@/lib/payments/availability';
import { OneclickCardsList, type OneclickCard } from './OneclickCardsList';
import TransbankDocumentForm, { type BillingData } from './TransbankDocumentForm';
import BillingDataForm, { type BasicBillingData } from './BillingDataForm';
import DiscountCodeInput from './DiscountCodeInput';

interface OrderCheckoutFormProps {
  orderId: string;
  order: Order;
  paymentConfig: PaymentConfig;
  defaultBillingData?: any;
}

export default function OrderCheckoutForm({
  orderId,
  order,
  paymentConfig,
  defaultBillingData,
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La moneda está asociada al país de la organización (order.currency)
  const selectedCurrency = currentOrder.currency;
  
  // Tab activa inicial basada en proveedores disponibles
  const initialProvider = paymentConfig.providers[0];
  const [activeTab, setActiveTab] = useState<string>(initialProvider);
  
  // Estados específicos de Transbank Oneclick
  const [oneclickTbkUser, setOneclickTbkUser] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<OneclickCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [loadingCards, setLoadingCards] = useState(activeTab === 'transbank');

  // Datos de facturación unificados
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [basicBillingData, setBasicBillingData] = useState<BasicBillingData | null>(null);
  
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  // Inicializar datos desde props o API
  useEffect(() => {
    const loadData = async () => {
      try {
        if (paymentConfig.providers.includes('transbank')) {
          setLoadingCards(true);
          const cardsResponse = await fetch('/api/transbank/oneclick/cards');
          if (cardsResponse.ok) {
            const cardsData = await cardsResponse.json();
            setSavedCards(cardsData.cards || []);
            const defaultCard = cardsData.cards?.find((c: OneclickCard) => c.is_default);
            if (defaultCard) {
              setSelectedCardId(defaultCard.id);
              setOneclickTbkUser(defaultCard.provider_payment_method_id);
            }
          }
          setLoadingCards(false);
        }

        if (defaultBillingData) {
          setBillingData(defaultBillingData);
          setBasicBillingData({
            tax_id: defaultBillingData.tax_id || '',
            name: defaultBillingData.name || '',
            email: defaultBillingData.email || '',
          });
        }
      } catch (err) {
        console.error('Error cargando datos iniciales:', err);
      } finally {
        setLoadingInitialData(false);
      }
    };

    loadData();
  }, [paymentConfig.providers, defaultBillingData]);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order.id]);

  // Detectar inscripciones Oneclick exitosas
  useEffect(() => {
    const tbkToken = searchParams.get('TBK_TOKEN');
    const type = searchParams.get('type');
    
    if (tbkToken && type === 'oneclick_inscription') {
      setLoading(true);
      fetch(`/api/transbank/oneclick/inscription/finish?token=${tbkToken}`, {
        method: 'POST',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tbkUser) {
            setOneclickTbkUser(data.tbkUser);
            setActiveTab('transbank');
            setShowAddCardForm(false);
            fetch('/api/transbank/oneclick/cards')
              .then(res => res.json())
              .then(cardsData => {
                setSavedCards(cardsData.cards || []);
                const newCard = cardsData.cards?.find(
                  (c: OneclickCard) => c.provider_payment_method_id === data.tbkUser
                );
                if (newCard) setSelectedCardId(newCard.id);
              });
            router.replace(window.location.pathname, { scroll: false });
          }
        })
        .catch(err => {
          console.error('Error finalizando inscripción:', err);
          setError(`Error procesando inscripción: ${err.message}`);
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams, router]);

  const handleCheckout = async (provider: string, subMethod?: string) => {
    setLoading(true);
    setError(null);

    // Determinar qué datos de facturación usar
    const currentBilling = (paymentConfig.country === 'CL' && paymentConfig.orgType === 'business') 
      ? billingData 
      : basicBillingData;

    if (!currentBilling) {
      setError('Por favor completa los datos de facturación');
      setLoading(false);
      return;
    }

    try {
      // 1. Guardar/Sincronizar datos de facturación
      await fetch('/api/billing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_data: currentBilling }),
      });

      // 2. Crear sesión de pago
      const returnUrl = `${window.location.origin}/checkout/${orderId}/success?provider=${provider}${subMethod ? `&method=${subMethod}` : ''}`;
      const cancelUrl = `${window.location.origin}/checkout/${orderId}`;
      
      const checkoutBody: any = {
        orderId,
        provider,
        returnUrl,
        cancelUrl,
        billing_data: currentBilling,
        currency: selectedCurrency, // Usar moneda del contexto global
      };

      // Manejo especial Oneclick
      if (provider === 'transbank' && subMethod === 'oneclick') {
        let tbkUserToUse = oneclickTbkUser;
        if (selectedCardId) {
          const card = savedCards.find(c => c.id === selectedCardId);
          if (card) tbkUserToUse = card.provider_payment_method_id;
        }

        if (!tbkUserToUse) {
          setError('Selecciona una tarjeta para pagar con Oneclick');
          setLoading(false);
          return;
        }

        const userRes = await fetch('/api/auth/user');
        const userData = await userRes.json();
        
        const response = await fetch('/api/transbank/oneclick/payment/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            orderId,
            tbkUser: tbkUserToUse,
            username: userData.id,
            billing_data: currentBilling,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error en pago Oneclick');

        if (data.success) {
          router.push(`${returnUrl}&token_ws=${encodeURIComponent(data.token || '')}`);
          return;
        } else {
          throw new Error('El pago fue rechazado por el banco.');
        }
      }

      // Checkout normal para otros proveedores
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutBody),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error creando pago');

      // Redirección según proveedor
      if (provider === 'transbank' && data.url && data.sessionId) {
        // Formulario POST para Transbank Webpay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.url;
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = data.sessionId;
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
      } else {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  const handleOneclickInscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/checkout/${orderId}?type=oneclick_inscription`;
      const response = await fetch('/api/transbank/oneclick/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error en inscripción');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.url;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'TBK_TOKEN';
      input.value = data.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Confirmar pedido gratuito (100% descuento)
  const handleConfirmFreeOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/payments/confirm-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error confirmando pedido');

      // Redirigir a página de éxito
      router.push(`/checkout/${orderId}/success?provider=free`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Verificar si el pedido es gratuito
  const isFreeOrder = Number(currentOrder.amount) === 0;

  if (loadingInitialData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tp-buttons)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario de Facturación Apropiado */}
      {paymentConfig.country === 'CL' && paymentConfig.orgType === 'business' ? (
        <TransbankDocumentForm
          countryCode={paymentConfig.country}
          defaultData={billingData || undefined}
          onDataChange={setBillingData}
        />
      ) : (
        <BillingDataForm
          countryCode={paymentConfig.country}
          defaultData={basicBillingData || undefined}
          onDataChange={setBasicBillingData}
          title="Datos de Facturación (Invoice)"
          description={paymentConfig.country === 'CL' ? 'Para clientes personales se emite Invoice vía Stripe.' : 'Necesitamos tus datos para el Invoice internacional.'}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumen de pago</CardTitle>
          <CardDescription>Revisa tu total antes de pagar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DiscountCodeInput
            orderId={orderId}
            order={currentOrder}
            onApplied={(payload) => {
              setCurrentOrder((prev) => ({
                ...prev,
                ...payload.order,
              }));
            }}
          />

          <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Subtotal</span>
              <span className="font-medium">
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: currentOrder.currency,
                  minimumFractionDigits: currentOrder.currency === 'CLP' ? 0 : 2,
                }).format(Number(currentOrder.original_amount ?? currentOrder.amount))}
              </span>
            </div>
            {Number(currentOrder.discount_amount || 0) > 0 && (
              <div className="flex justify-between items-center text-sm text-green-700">
                <span>Descuento</span>
                <span className="font-medium">
                  -{new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: currentOrder.currency,
                    minimumFractionDigits: currentOrder.currency === 'CLP' ? 0 : 2,
                  }).format(Number(currentOrder.discount_amount))}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-semibold">
              <span>Total</span>
              <span>
                {new Intl.NumberFormat('es-CL', {
                  style: 'currency',
                  currency: currentOrder.currency,
                  minimumFractionDigits: currentOrder.currency === 'CLP' ? 0 : 2,
                }).format(Number(currentOrder.amount))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pedido Gratuito - Confirmar sin pago */}
      {isFreeOrder ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Gift className="h-5 w-5" />
              Pedido sin costo
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-400">
              Tu descuento cubre el 100% del pedido. Solo confirma para activar el servicio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleConfirmFreeOrder} 
              disabled={loading} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              Confirmar pedido
            </Button>
          </CardContent>
        </Card>
      ) : (
      /* Tabs de Proveedores */
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${paymentConfig.providers.length}`}>
          {paymentConfig.providers.map(p => (
            <TabsTrigger key={p} value={p} className="capitalize">
              {p === 'transbank' ? 'Webpay / Oneclick' : p}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Contenido Transbank */}
        {paymentConfig.providers.includes('transbank') && (
          <TabsContent value="transbank" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transbank</CardTitle>
                <CardDescription>Paga con Webpay Plus o usa tus tarjetas guardadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="webpay_plus">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="webpay_plus">Webpay Plus</TabsTrigger>
                    <TabsTrigger value="oneclick">Oneclick</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="webpay_plus" className="space-y-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total</span>
                    <span className="text-xl font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: currentOrder.currency }).format(Number(currentOrder.amount))}</span>
                      </div>
                    </div>
                    <Button onClick={() => handleCheckout('transbank')} disabled={loading || !billingData} className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                      Pagar con Webpay Plus
                    </Button>
                  </TabsContent>

                  <TabsContent value="oneclick" className="space-y-4">
                    {loadingCards ? (
                      <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : savedCards.length > 0 && !showAddCardForm ? (
                      <>
                        <OneclickCardsList
                          cards={savedCards}
                          selectedCardId={selectedCardId || undefined}
                          onCardSelect={(id) => { setSelectedCardId(id); }}
                          onCardDeleted={() => { /* recargar tarjetas */ }}
                          showActions={true}
                        />
                        <Button variant="outline" onClick={() => setShowAddCardForm(true)} className="w-full"><Plus className="mr-2 h-4 w-4" /> Agregar otra</Button>
                        <Button onClick={() => handleCheckout('transbank', 'oneclick')} disabled={loading || !selectedCardId || !billingData} className="w-full bg-[var(--tp-buttons)]">
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                          Pagar con Oneclick
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <Alert><Info className="h-4 w-4" /><AlertDescription>Serás redirigido para inscribir tu tarjeta.</AlertDescription></Alert>
                        <Button onClick={handleOneclickInscription} disabled={loading} className="w-full bg-[var(--tp-buttons)]">Inscribir Tarjeta</Button>
                        {savedCards.length > 0 && <Button variant="ghost" onClick={() => setShowAddCardForm(false)} className="w-full">Cancelar</Button>}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contenido Flow */}
        {paymentConfig.providers.includes('flow') && (
          <TabsContent value="flow" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Flow</CardTitle>
                <CardDescription>Paga con Servipag, Webpay, Multicaja y más.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="text-xl font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: currentOrder.currency }).format(Number(currentOrder.amount))}</span>
                  </div>
                </div>
                <Button onClick={() => handleCheckout('flow')} disabled={loading || !billingData} className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Pagar con Flow
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contenido Stripe */}
        {paymentConfig.providers.includes('stripe') && (
          <TabsContent value="stripe" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Stripe</CardTitle>
                <CardDescription>Paga de forma segura con tu tarjeta internacional.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="text-xl font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: currentOrder.currency }).format(Number(currentOrder.amount))}</span>
                  </div>
                </div>
                <Button onClick={() => handleCheckout('stripe')} disabled={loading || !basicBillingData} className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Pagar con Stripe
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Contenido DLocalGo */}
        {paymentConfig.providers.includes('dlocalgo') && (
          <TabsContent value="dlocalgo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>DLocal Go</CardTitle>
                <CardDescription>Usa métodos de pago locales de tu país.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total</span>
                    <span className="text-xl font-bold">{new Intl.NumberFormat('es-CL', { style: 'currency', currency: currentOrder.currency }).format(Number(currentOrder.amount))}</span>
                  </div>
                </div>
                <Button onClick={() => handleCheckout('dlocalgo')} disabled={loading || !basicBillingData} className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                  Pagar con DLocal Go
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      )}

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
