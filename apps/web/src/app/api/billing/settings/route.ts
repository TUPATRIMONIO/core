import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * GET /api/billing/settings
 * Obtiene la configuración de facturación de la organización
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
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
        { status: 404 }
      );
    }

    // Obtener configuración desde organizations.settings
    const serviceSupabase = createServiceRoleClient();
    
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('settings')
      .eq('id', orgUser.organization_id)
      .single();

    const billingData = (org?.settings as any)?.billing_data || null;

    return NextResponse.json({
      billing_data: billingData,
    });
  } catch (error: any) {
    console.error('[Billing Settings GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/billing/settings
 * Guarda la configuración de facturación de la organización
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
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
        { status: 404 }
      );
    }

    const body = await request.json();
    const { billing_data } = body;

    if (!billing_data) {
      return NextResponse.json(
        { error: 'billing_data es requerido' },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceRoleClient();

    // Guardar en organizations.settings
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('settings')
      .eq('id', orgUser.organization_id)
      .single();

    const currentSettings = (org?.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      billing_data,
    };

    const { error: updateError } = await serviceSupabase
      .from('organizations')
      .update({ settings: updatedSettings })
      .eq('id', orgUser.organization_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      billing_data,
    });
  } catch (error: any) {
    console.error('[Billing Settings PUT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

