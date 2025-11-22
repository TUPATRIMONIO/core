import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntentForCredits } from '@/lib/stripe/checkout';

export const runtime = 'nodejs';

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Obtener o crear organización
    const organizationId = await getOrCreateOrganization(user.id, user.email || 'test@tupatrimonio.com');
    
    const body = await request.json();
    const { packageId } = body;
    
    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId es requerido' },
        { status: 400 }
      );
    }
    
    const result = await createPaymentIntentForCredits(
      organizationId,
      packageId
    );
    
    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntent.id,
      invoiceId: result.invoice.id,
    });
  } catch (error: any) {
    console.error('Error creando checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

