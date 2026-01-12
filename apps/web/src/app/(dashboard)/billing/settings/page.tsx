import { getBillingOverviewAction } from '@/lib/billing/actions';
import { getAvailablePackages } from '@/lib/credits/packages';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AutoRechargeSettings } from '@/components/billing/AutoRechargeSettings';
import { CountrySelector } from '@/components/billing/CountrySelector';
import { CurrencySelector } from '@/components/billing/CurrencySelector';
import BillingDataSettings from '@/components/billing/BillingDataSettings';

export default async function BillingSettingsPage() {
  const overview = await getBillingOverviewAction();
  const supabase = await createClient();
  
  // Obtener organización activa del usuario
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  
  // Usar RPC para obtener la organización activa específica
  const { data: activeOrgData } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id
  });
  
  if (!activeOrgData || activeOrgData.length === 0) {
    throw new Error('No active organization found');
  }
  
  const organizationId = activeOrgData[0].organization_id;
  
  // Obtener datos de la organización
  const { data: org } = await supabase
    .from('organizations')
    .select('country, org_type')
    .eq('id', organizationId)
    .single();
  
  const countryCode = org?.country || 'US';
  const orgType = org?.org_type || 'personal';
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
        
        <CurrencySelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AutoRechargeSettings 
          account={overview.account}
          paymentMethods={overview.paymentMethods}
          packages={packages}
        />
      </div>

      <div className="mt-6">
        <BillingDataSettings countryCode={countryCode} orgType={orgType} />
      </div>
    </div>
  );
}

