/**
 * API Route: /api/organizations/set-active
 * Permite actualizar la organización activa del usuario
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { organizationId } = await request.json();

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { error: 'organizationId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario pertenece a la organización
    const { data: membership, error: membershipError } = await supabase
      .schema('core')
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();

    if (membershipError) {
      console.error('Error verificando organización:', membershipError);
      return NextResponse.json(
        { error: 'No se pudo verificar la organización' },
        { status: 500 }
      );
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta organización' },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update({ last_active_organization_id: organizationId })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando organización activa:', updateError);
      return NextResponse.json(
        { error: 'No se pudo actualizar la organización activa' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en POST /api/organizations/set-active:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
