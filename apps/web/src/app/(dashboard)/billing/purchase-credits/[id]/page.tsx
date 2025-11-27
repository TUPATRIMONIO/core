import { getAvailablePackages } from '@/lib/credits/packages';
import { createClient } from '@/lib/supabase/server';
import { createOrder } from '@/lib/checkout/core';
import { getCurrencyForCountry, getLocalizedPrice } from '@/lib/stripe/checkout';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';

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
  const amount = getLocalizedPrice(selectedPackage, countryCode);
  
  // Crear orden primero
  try {
    const order = await createOrder({
      orgId: organizationId,
      productType: 'credits',
      productId: selectedPackage.id,
      productData: {
        package_id: selectedPackage.id,
        name: selectedPackage.name,
        description: selectedPackage.description,
        credits_amount: selectedPackage.credits_amount,
        price_usd: selectedPackage.price_usd,
        localized_price: amount,
        currency,
      },
      amount,
      currency,
      metadata: {},
      expiresInHours: 24,
    });
    
    // Redirigir a página de checkout de la orden
    redirect(`/checkout/${order.id}`);
  } catch (error: any) {
    console.error('Error creando orden:', error);
    // Si hay error, mostrar página de error o redirigir
    throw error;
  }
}


