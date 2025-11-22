import { getAvailablePackages } from '@/lib/credits/packages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function PurchaseCreditsPage() {
  const supabase = await createClient();
  
  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();
  
  // Obtener país de la organización
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', orgUser?.organization_id)
    .single();
  
  const countryCode = org?.country || 'US';
  const packages = await getAvailablePackages(countryCode);
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comprar Créditos</h1>
        <p className="text-muted-foreground mt-2">
          Selecciona un paquete de créditos para agregar a tu cuenta
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg: any) => (
          <Card key={pkg.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {pkg.localized_price?.toLocaleString() || pkg.price_usd.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {pkg.currency || 'USD'}
                </p>
                <p className="text-lg font-semibold mt-2">
                  {pkg.credits_amount.toLocaleString()} créditos
                </p>
              </div>
              <Button className="w-full mt-auto" asChild>
                <a href={`/billing/purchase-credits/${pkg.id}`}>
                  Comprar Ahora
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

