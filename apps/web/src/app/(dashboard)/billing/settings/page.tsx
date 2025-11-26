import { getBillingOverviewAction } from '@/lib/billing/actions';
import { getAvailablePackages } from '@/lib/credits/packages';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AutoRechargeSettings } from '@/components/billing/AutoRechargeSettings';
import { CountrySelector } from '@/components/billing/CountrySelector';

export default async function BillingSettingsPage() {
  const overview = await getBillingOverviewAction();
  const supabase = await createClient();
  
  // Obtener organización para determinar país
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', user?.id)
    .eq('status', 'active')
    .single();
  
  const { data: org } = await supabase
    .from('organizations')
    .select('country')
    .eq('id', orgUser?.organization_id)
    .single();
  
  const countryCode = org?.country || 'US';
  const packages = await getAvailablePackages(countryCode);
  
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
            <h1 className="text-3xl font-bold">Configuración de Facturación</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona la auto-recarga y otras configuraciones de facturación
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountrySelector currentCountry={countryCode} />
        
        <AutoRechargeSettings 
          account={overview.account}
          paymentMethods={overview.paymentMethods}
          packages={packages}
        />
      </div>
    </div>
  );
}

