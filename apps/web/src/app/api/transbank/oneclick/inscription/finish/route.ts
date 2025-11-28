import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleOneclickInscriptionFinish } from '@/lib/transbank/webhooks';
import { saveOneclickCard } from '@/lib/transbank/payment-methods';

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
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'token es requerido' },
        { status: 400 }
      );
    }
    
    // Obtener o crear organización
    const organizationId = await getOrCreateOrganization(user.id, user.email || 'test@tupatrimonio.com');
    
    // Finalizar inscripción en Transbank
    const result = await handleOneclickInscriptionFinish(token);
    
    console.log('📝 Resultado de Transbank:', {
      success: result.success,
      tbkUser: result.tbkUser,
      username: result.username,
      authorizationCode: result.authorizationCode,
      card_type: (result as any).card_type,
      card_number: (result as any).card_number,
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error finalizando inscripción' },
        { status: 500 }
      );
    }
    
    // Guardar tarjeta en BD
    // Usar user.id como username (el mismo que se usó en la inscripción)
    const username = user.id;
    
    let paymentMethodId = null;
    let saveError = null;
    try {
      console.log('💾 Intentando guardar tarjeta con:', {
        organizationId,
        tbkUser: result.tbkUser,
        username: username,
        userId: user.id,
        hasAuthCode: !!result.authorizationCode,
      });
      
      const savedCard = await saveOneclickCard(
        organizationId,
        result.tbkUser,
        username,
        {
          authorization_code: result.authorizationCode,
          card_type: (result as any).card_type,
          card_number: (result as any).card_number,
        },
        false // No marcar como default automáticamente
      );
      paymentMethodId = savedCard.id;
      console.log('✅ Tarjeta OneClick guardada:', { paymentMethodId, tbkUser: result.tbkUser });
    } catch (err: any) {
      saveError = err.message || 'Error desconocido al guardar tarjeta';
      console.error('⚠️ Error guardando tarjeta en BD:', {
        error: saveError,
        errorStack: err.stack,
        tbkUser: result.tbkUser,
        username: username,
        organizationId,
      });
    }
    
    return NextResponse.json({
      success: true,
      tbkUser: result.tbkUser,
      username: username, // Retornar el username que usamos (user.id)
      authorizationCode: result.authorizationCode,
      paymentMethodId,
      saveError, // Incluir el error si existe
    });
  } catch (error: any) {
    console.error('Error finalizando inscripción Oneclick:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

