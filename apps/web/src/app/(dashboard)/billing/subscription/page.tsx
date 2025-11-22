import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Zap, Building2 } from 'lucide-react';
import Link from 'next/link';
import { SubscriptionManagement } from '@/components/billing/SubscriptionManagement';
import { notFound } from 'next/navigation';

export default async function SubscriptionPage() {
  const supabase = await createClient();
  
  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();
  
  if (!orgUser) {
    notFound();
  }
  
  // Obtener suscripción actual
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select(`
      *,
      subscription_plans (*)
    `)
    .eq('organization_id', orgUser.organization_id)
    .single();
  
  // Obtener todos los planes activos
  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Suscripción</h1>
            <p className="text-muted-foreground mt-2">
              Administra tu plan y cambia cuando lo necesites
            </p>
          </div>
        </div>
      </div>
      
      {/* Plan Actual */}
      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Plan Actual
                  {subscription.status === 'active' && (
                    <Badge variant="default">Activo</Badge>
                  )}
                  {subscription.status === 'cancelled' && (
                    <Badge variant="outline">Cancelado</Badge>
                  )}
                  {subscription.status === 'trial' && (
                    <Badge variant="secondary">Prueba</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {subscription.subscription_plans?.name || 'Sin plan'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Próxima factura</p>
                <p className="font-semibold">
                  {new Date(subscription.current_period_end).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio mensual</p>
                <p className="font-semibold">
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: subscription.currency || 'USD',
                  }).format(subscription.price_monthly)}
                </p>
              </div>
              {subscription.cancelled_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Cancelado el</p>
                  <p className="font-semibold">
                    {new Date(subscription.cancelled_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              )}
            </div>
            
            {subscription.subscription_plans && (
              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Características incluidas:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(subscription.subscription_plans.features || {}).map(([key, value]: [string, any]) => {
                    if (Array.isArray(value)) {
                      return value.map((feature: string, idx: number) => (
                        <div key={`${key}-${idx}`} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-[var(--tp-buttons)]" />
                          <span>{feature}</span>
                        </div>
                      ));
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Gestión de Suscripción */}
      <SubscriptionManagement 
        currentSubscription={subscription} 
        availablePlans={plans || []} 
      />
    </div>
  );
}

