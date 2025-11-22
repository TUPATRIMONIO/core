import { getAvailablePackages } from '@/lib/credits/packages';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import StripeCheckout from '@/components/billing/StripeCheckout';
import DLocalCheckout from '@/components/billing/DLocalCheckout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notFound } from 'next/navigation';

// Países LATAM que usan dLocal
const LATAM_COUNTRIES = ['CL', 'AR', 'CO', 'MX', 'PE'];

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Helper: Obtiene o crea organización para el usuario
 */
async function getOrCreateOrganization(userId: string, userEmail: string) {
  const supabase = await createClient();
  
  // Intentar obtener la organización activa del usuario usando la función RPC
  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: userId
  });
  
  if (activeOrg && activeOrg.length > 0) {
    return activeOrg[0].organization_id;
  }
  
  // Si no tiene organización, intentar crearla
  const { data: orgId, error: createError } = await supabase.rpc('create_personal_organization', {
    user_id: userId,
    user_email: userEmail,
    user_first_name: null
  });
  
  // Si hay error al crear, verificar si ya existe usando la función RPC
  if (createError) {
    const { data: retryActiveOrg } = await supabase.rpc('get_user_active_organization', {
      user_id: userId
    });
    
    if (retryActiveOrg && retryActiveOrg.length > 0) {
      return retryActiveOrg[0].organization_id;
    }
    
    // Si aún no hay organización, lanzar el error original
    throw new Error(`No organization found and failed to create: ${createError.message || 'Unknown error'}`);
  }
  
  if (!orgId) {
    throw new Error('Failed to create organization: No ID returned');
  }
  
  return orgId;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Obtener usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notFound();
  }
  
  // Obtener o crear organización
  const organizationId = await getOrCreateOrganization(user.id, user.email || 'test@tupatrimonio.com');
  
  // Obtener país de la organización
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', organizationId)
    .single();
  
  if (!org) {
    notFound();
  }
  
  const countryCode = org.country || 'US';
  const packages = await getAvailablePackages(countryCode);
  const selectedPackage = packages.find((pkg: any) => pkg.id === id);
  
  if (!selectedPackage) {
    notFound();
  }
  
  const currency = getCurrencyForCountry(countryCode);
  const amount = selectedPackage.localized_price || selectedPackage.price_usd;
  const isLATAM = LATAM_COUNTRIES.includes(countryCode);
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/billing/purchase-credits">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Completar Compra</h1>
          <p className="text-muted-foreground mt-2">
            Finaliza tu compra de créditos
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen del paquete */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Resumen del Paquete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPackage.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPackage.description}
                </p>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Créditos</span>
                  <span className="font-semibold">
                    {selectedPackage.credits_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: currency,
                    }).format(amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-xl font-bold text-[var(--tp-buttons)]">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: currency,
                    }).format(amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Formulario de pago */}
        <div className="lg:col-span-2">
          {isLATAM ? (
            <Tabs defaultValue="dlocal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dlocal">Métodos Locales</TabsTrigger>
                <TabsTrigger value="stripe">Tarjeta Internacional</TabsTrigger>
              </TabsList>
              <TabsContent value="dlocal" className="mt-6">
                <DLocalCheckout
                  packageId={selectedPackage.id}
                  packageName={selectedPackage.name}
                  creditsAmount={selectedPackage.credits_amount}
                  amount={amount}
                  currency={currency}
                  countryCode={countryCode}
                />
              </TabsContent>
              <TabsContent value="stripe" className="mt-6">
                <StripeCheckout
                  packageId={selectedPackage.id}
                  packageName={selectedPackage.name}
                  creditsAmount={selectedPackage.credits_amount}
                  amount={amount}
                  currency={currency}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <StripeCheckout
              packageId={selectedPackage.id}
              packageName={selectedPackage.name}
              creditsAmount={selectedPackage.credits_amount}
              amount={amount}
              currency={currency}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function getCurrencyForCountry(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    CL: 'CLP',
    AR: 'ARS',
    CO: 'COP',
    MX: 'MXN',
    PE: 'PEN',
    US: 'USD',
  };
  
  return currencyMap[countryCode.toUpperCase()] || 'USD';
}

