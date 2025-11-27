'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CreditCard, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Order } from '@/lib/checkout/core';

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
  const [oneclickUsername, setOneclickUsername] = useState('');
  const [oneclickTbkUser, setOneclickTbkUser] = useState<string | null>(null);

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
            setOneclickTbkUser(data.tbkUser);
            setOneclickUsername(data.username || '');
            setActiveTab('oneclick');
            // Limpiar URL
            router.replace(window.location.pathname, { scroll: false });
          }
        })
        .catch(err => {
          console.error('Error obteniendo datos de inscripción:', err);
        });
    }
  }, [searchParams, router]);

  const handleWebpayPlus = async () => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/checkout/${orderId}/success?provider=transbank`;
      
      const response = await fetch('/api/transbank/checkout/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          orderId,
          returnUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando pago');
      }

      // Redirigir a Transbank usando formulario POST con token_ws
      if (data.url && data.token) {
        // Normalizar URL: remover puerto :443 explícito si está presente
        let normalizedUrl = data.url;
        try {
          const urlObj = new URL(data.url);
          // Remover puerto 443 explícito (HTTPS ya usa 443 por defecto)
          if (urlObj.port === '443') {
            urlObj.port = '';
            normalizedUrl = urlObj.toString();
          }
        } catch (e) {
          console.error('[OrderCheckoutForm] Error normalizando URL:', e);
        }
        
        console.log('[OrderCheckoutForm] Redirigiendo a Transbank:', {
          originalUrl: data.url,
          normalizedUrl,
          token: data.token.substring(0, 20) + '...',
        });
        
        // Validar que la URL sea válida
        try {
          const urlObj = new URL(normalizedUrl);
          if (!urlObj.hostname.includes('transbank') && !urlObj.hostname.includes('santander')) {
            console.warn('[OrderCheckoutForm] URL de Transbank inesperada:', normalizedUrl);
          }
        } catch (e) {
          console.error('[OrderCheckoutForm] URL inválida:', normalizedUrl);
          throw new Error('URL de redirección inválida');
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
        tokenInput.value = data.token;
        form.appendChild(tokenInput);
        
        // Agregar formulario al DOM y auto-enviarlo
        document.body.appendChild(form);
        
        // Pequeño delay para asegurar que el formulario está en el DOM
        setTimeout(() => {
          form.submit();
        }, 100);
      } else {
        throw new Error('No se recibió URL o token de redirección');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOneclickInscription = async () => {
    setLoading(true);
    setError(null);

    if (!oneclickUsername.trim()) {
      setError('Por favor ingresa un nombre de usuario');
      setLoading(false);
      return;
    }

    try {
      const returnUrl = `${window.location.origin}/checkout/${orderId}?type=oneclick_inscription`;
      
      const response = await fetch('/api/transbank/oneclick/inscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: oneclickUsername,
          returnUrl,
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
    if (!oneclickTbkUser) {
      setError('Primero debes inscribir tu tarjeta');
      return;
    }

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
          tbkUser: oneclickTbkUser,
          username: oneclickUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando pago');
      }

      // Si el pago fue exitoso, redirigir
      if (data.success) {
        router.push(`/checkout/${orderId}/success?provider=transbank&method=oneclick`);
      } else {
        throw new Error('Error procesando el pago con Oneclick');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/checkout/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creando sesión de pago');
      }

      // Redirigir a Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de redirección');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      setLoading(false);
    }
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

              {!oneclickTbkUser ? (
                <>
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium">
                      Nombre de usuario
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={oneclickUsername}
                      onChange={(e) => setOneclickUsername(e.target.value)}
                      placeholder="Ingresa un nombre de usuario"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nombre identificará tu tarjeta guardada
                    </p>
                  </div>

                  <Button
                    onClick={handleOneclickInscription}
                    disabled={loading || !oneclickUsername.trim()}
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
                        Inscribir Tarjeta
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      Tarjeta inscrita correctamente. Puedes proceder con el pago.
                    </AlertDescription>
                  </Alert>

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
                        Pagar con Oneclick
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

