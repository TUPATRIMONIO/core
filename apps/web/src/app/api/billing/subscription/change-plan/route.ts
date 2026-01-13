import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSubscription } from '@/lib/stripe/subscriptions';
import { getActiveOrganizationId } from '@/lib/organization/get-active-org';

export const runtime = 'nodejs';

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
    
    // Obtener organización del usuario
    const { organizationId, error: orgError } = await getActiveOrganizationId(supabase, user.id);
    
    if (orgError || !organizationId) {
      return NextResponse.json(
        { error: orgError || 'Organización no encontrada' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { planId } = body;
    
    if (!planId) {
      return NextResponse.json(
        { error: 'planId es requerido' },
        { status: 400 }
      );
    }
    
    const result = await updateSubscription(organizationId, planId);
    
    return NextResponse.json({ 
      success: true,
      subscription: result.subscription 
    });
  } catch (error: any) {
    console.error('Error cambiando plan:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

