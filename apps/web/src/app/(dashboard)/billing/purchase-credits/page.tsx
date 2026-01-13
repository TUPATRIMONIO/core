import { getAvailablePackages } from '@/lib/credits/packages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function PurchaseCreditsPage() {
  const supabase = await createClient();
  
  // Obtener organización del usuario
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Si no hay usuario, usar default
    const packages = await getAvailablePackages('CL');
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
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: pkg.currency || 'USD',
                      minimumFractionDigits: pkg.currency === 'CLP' ? 0 : 2,
                      maximumFractionDigits: pkg.currency === 'CLP' ? 0 : 2,
                    }).format(pkg.localized_price ?? pkg.price_usd ?? 0)}
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    {pkg.credits_amount.toLocaleString()} créditos
                  </p>
                </div>
                <Button className="w-full mt-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]" asChild>
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
  
  // Usar la función RPC para obtener la organización activa (maneja múltiples organizaciones)
  const { data: activeOrgData } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id
  });
  
  let countryCode = 'CL'; // Default para Chile
  
  if (activeOrgData && activeOrgData.length > 0) {
    const organizationId = activeOrgData[0].organization_id;
    
    // Obtener país de la organización activa
    const { data: org } = await supabase
      .from('organizations')
      .select('country')
      .eq('id', organizationId)
      .single();
    
    if (org?.country) {
      countryCode = org.country;
    }
  }
  
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
                  {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: pkg.currency || 'USD',
                    minimumFractionDigits: pkg.currency === 'CLP' ? 0 : 2,
                    maximumFractionDigits: pkg.currency === 'CLP' ? 0 : 2,
                  }).format(pkg.localized_price ?? pkg.price_usd ?? 0)}
                </p>
                <p className="text-lg font-semibold mt-2">
                  {pkg.credits_amount.toLocaleString()} créditos
                </p>
              </div>
              <Button className="w-full mt-auto bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]" asChild>
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

