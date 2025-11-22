import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSubscription } from '@/lib/stripe/subscriptions';

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
    const { data: orgUser } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();
    
    if (!orgUser) {
      return NextResponse.json(
        { error: 'Organización no encontrada' },
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
    
    const result = await updateSubscription(orgUser.organization_id, planId);
    
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

