/**
 * API Route: /api/crm/email-accounts/[id]
 * Gestión de cuenta de email individual
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Obtener detalles de una cuenta
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar Service Role para bypasear RLS (ya validamos permisos arriba)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: account, error } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('[GET /api/crm/email-accounts/[id]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Actualizar configuración de cuenta
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Solo permitir actualizar ciertos campos
    const allowedFields = [
      'display_name',
      'is_active',
      'is_default',
      'sync_enabled',
      'sync_to_inbox',
      'sync_interval',
      'signature_html',
      'signature_text'
    ];

    const updateData: any = {};
    Object.keys(body).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // Usar Service Role para bypasear RLS (ya validamos permisos arriba)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: account, error } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('[PATCH /api/crm/email-accounts/[id]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Desconectar cuenta (soft delete)
 * En lugar de eliminar físicamente, marca la cuenta como inactiva
 * para preservar el historial de emails
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg) {
      return NextResponse.json({ error: 'No estás autenticado. Por favor inicia sesión.' }, { status: 401 });
    }

    if (!userWithOrg.organizationId) {
      return NextResponse.json({ error: 'No tienes una organización asignada.' }, { status: 403 });
    }

    // Usar Service Role para bypasear RLS (ya validamos permisos arriba)
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[DELETE /api/crm/email-accounts/[id]] Disconnecting account:', id, 'for org:', userWithOrg.organizationId);

    // Verificar que la cuenta existe y pertenece a la organización
    const { data: account, error: checkError } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .select('id, email_address, is_active')
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (checkError || !account) {
      console.error('[DELETE /api/crm/email-accounts/[id]] Account not found:', { checkError, account });
      return NextResponse.json({ error: 'Cuenta no encontrada o no tienes permisos para desconectarla.' }, { status: 404 });
    }

    // Verificar si ya está desconectada
    if (!account.is_active) {
      return NextResponse.json({ 
        success: true, 
        message: 'La cuenta ya está desconectada',
        already_disconnected: true 
      });
    }

    // Soft delete: marcar como inactiva en lugar de eliminar
    // Esto preserva el historial de emails asociados
    const { error: updateError } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .update({ 
        is_active: false,
        sync_enabled: false
      })
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId);

    if (updateError) {
      console.error('[DELETE /api/crm/email-accounts/[id]] Update error:', updateError);
      return NextResponse.json({ 
        error: `Error al desconectar la cuenta: ${updateError.message}` 
      }, { status: 500 });
    }

    console.log('[DELETE /api/crm/email-accounts/[id]] Successfully disconnected account:', id);
    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta desconectada exitosamente. El historial de emails se ha preservado.' 
    });
  } catch (error) {
    console.error('[DELETE /api/crm/email-accounts/[id]]:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor. Por favor intenta de nuevo.' 
    }, { status: 500 });
  }
}

