import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setDefaultPaymentMethod } from '@/lib/stripe/payment-methods';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const method = await setDefaultPaymentMethod(orgUser.organization_id, id);
    
    return NextResponse.json({ method });
  } catch (error: any) {
    console.error('Error setting default payment method:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

