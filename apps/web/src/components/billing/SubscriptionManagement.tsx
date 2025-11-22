'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Building2, Loader2 } from 'lucide-react';
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

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  is_popular: boolean;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  cancelled_at?: string;
}

interface SubscriptionManagementProps {
  currentSubscription?: Subscription & { subscription_plans?: Plan };
  availablePlans: Plan[];
}

export function SubscriptionManagement({ currentSubscription, availablePlans }: SubscriptionManagementProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const currentPlanId = currentSubscription?.plan_id;
  const isCancelled = currentSubscription?.status === 'cancelled';

  const handleChangePlan = async (planId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/billing/subscription/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al cambiar plan');
        }

        router.refresh();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al cambiar plan');
      }
    });
  };

  const handleCancelSubscription = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/billing/subscription/cancel', {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al cancelar suscripción');
        }

        router.refresh();
      } catch (error: any) {
        console.error('Error:', error.message || 'Error al cancelar suscripción');
      }
    });
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free':
        return <Zap className="h-5 w-5" />;
      case 'enterprise':
        return <Crown className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const isCurrentPlan = (planId: string) => planId === currentPlanId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Planes Disponibles</h2>
        <p className="text-muted-foreground">
          Elige el plan que mejor se adapte a tus necesidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availablePlans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isUpgrade = currentPlanId && plan.price_monthly > (availablePlans.find(p => p.id === currentPlanId)?.price_monthly || 0);
          const isDowngrade = currentPlanId && plan.price_monthly < (availablePlans.find(p => p.id === currentPlanId)?.price_monthly || 0);

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.is_popular ? 'border-[var(--tp-buttons)] border-2' : ''} ${isCurrent ? 'bg-muted/50' : ''}`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[var(--tp-buttons)] text-white">
                    Más Popular
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="default">Plan Actual</Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(plan.slug)}
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: plan.currency,
                    }).format(plan.price_monthly)}
                  </p>
                  <p className="text-sm text-muted-foreground">por mes</p>
                </div>

                <div className="space-y-2">
                  {Object.entries(plan.features || {}).map(([key, value]: [string, any]) => {
                    if (Array.isArray(value)) {
                      return value.map((feature: string, idx: number) => (
                        <div key={`${key}-${idx}`} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-[var(--tp-buttons)] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ));
                    }
                    return null;
                  })}
                </div>

                <div className="pt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plan Actual
                    </Button>
                  ) : isCancelled ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            'Suscribirse'
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Suscribirse a {plan.name}</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro de que deseas suscribirte al plan {plan.name}?
                            Se te cobrará {new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: plan.currency,
                            }).format(plan.price_monthly)} por mes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleChangePlan(plan.id)}
                            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant={isUpgrade ? 'default' : 'outline'} 
                          className={`w-full ${isUpgrade ? 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]' : ''}`}
                        >
                          {isUpgrade ? 'Actualizar' : isDowngrade ? 'Degradar' : 'Cambiar'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isUpgrade ? 'Actualizar' : 'Degradar'} a {plan.name}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isUpgrade
                              ? `¿Estás seguro de que deseas actualizar al plan ${plan.name}? Se aplicará un prorrateo y se te cobrará la diferencia.`
                              : `¿Estás seguro de que deseas degradar al plan ${plan.name}? Los cambios se aplicarán al final del período actual.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleChangePlan(plan.id)}
                            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
                          >
                            {isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              'Confirmar'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cancelar Suscripción */}
      {currentSubscription && currentSubscription.status === 'active' && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>
              Cancelar tu suscripción eliminará el acceso a las características premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Cancelar Suscripción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu suscripción seguirá activa hasta el{' '}
                    {new Date(currentSubscription.current_period_end).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    . Después de esa fecha, perderás el acceso a las características premium.
                    ¿Estás seguro de que deseas cancelar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener Suscripción</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      'Sí, Cancelar'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

