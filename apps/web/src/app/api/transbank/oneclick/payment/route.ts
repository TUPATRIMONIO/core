import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOneclickPayment } from '@/lib/transbank/checkout';

async function getOrCreateOrganization(userId: string, userEmail: string) {
  const supabase = await createClient();
  
  // Buscar organización existente del usuario
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  if (orgUser?.organization_id) {
    return orgUser.organization_id;
  }
  
  // Crear nueva organización si no existe
  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: 'Mi Organización',
      email: userEmail,
    })
    .select('id')
    .single();
  
  if (orgError || !newOrg?.id) {
    throw new Error(`Failed to create organization: ${orgError?.message || 'No ID returned'}`);
  }
  
  // Crear relación usuario-organización
  await supabase
    .from('organization_users')
    .insert({
      user_id: userId,
      organization_id: newOrg.id,
      role: 'owner',
      status: 'active',
    });
  
  return newOrg.id;
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
    const { packageId, tbkUser, username } = body;
    
    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId es requerido' },
        { status: 400 }
      );
    }
    
    if (!tbkUser) {
      return NextResponse.json(
        { error: 'tbkUser es requerido' },
        { status: 400 }
      );
    }
    
    if (!username) {
      return NextResponse.json(
        { error: 'username es requerido' },
        { status: 400 }
      );
    }
    
    const result = await createOneclickPayment(
      organizationId,
      packageId,
      tbkUser,
      username
    );
    
    // El pago ya está autorizado, verificar el status
    const isAuthorized = result.payment?.status === 'authorized';
    
    return NextResponse.json({
      success: isAuthorized,
      token: result.token,
      url: result.url, // Vacío porque el pago ya está autorizado
      invoiceId: result.invoice.id,
      paymentStatus: result.payment?.status, // Estado del pago (authorized/rejected)
    });
  } catch (error: any) {
    console.error('Error creando pago Oneclick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

