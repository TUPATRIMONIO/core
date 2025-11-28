import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createOneclickInscription } from '@/lib/transbank/checkout';

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
    const { returnUrl } = body;
    
    // Usar user.id como username (inmutable, único, 36 caracteres - dentro del límite de 40)
    const username = user.id;
    
    if (!returnUrl) {
      return NextResponse.json(
        { error: 'returnUrl es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener email de la organización
    const { data: org } = await supabase
      .from('organizations')
      .select('email')
      .eq('id', organizationId)
      .single();
    
    const result = await createOneclickInscription(
      organizationId,
      username,
      org?.email || user.email || '',
      returnUrl
    );
    
    return NextResponse.json({
      token: result.token,
      url: result.url,
    });
  } catch (error: any) {
    console.error('Error iniciando inscripción Oneclick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

