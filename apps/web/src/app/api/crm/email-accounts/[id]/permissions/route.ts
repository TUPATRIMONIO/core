/**
 * API Route: /api/crm/email-accounts/[id]/permissions
 * Gestión de permisos de usuarios sobre una cuenta de email compartida
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Listar usuarios con acceso a esta cuenta
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que la cuenta pertenece a la org
    const { data: account } = await supabase
      .schema('crm')
      .from('email_accounts')
      .select('id')
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Obtener permisos
    const { data: permissions, error } = await supabase
      .schema('crm')
      .from('email_account_permissions')
      .select('*')
      .eq('email_account_id', id)
      .is('revoked_at', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: permissions || [] });
  } catch (error) {
    console.error('[GET /api/crm/email-accounts/[id]/permissions]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Otorgar permiso a un usuario
 * Body: { user_id, can_send, can_receive, is_default }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, can_send = true, can_receive = true, is_default = false } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Verificar que la cuenta pertenece a la org
    const { data: account } = await supabase
      .schema('crm')
      .from('email_accounts')
      .select('id, account_type')
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // No permitir agregar permisos a cuentas personales
    if (account.account_type === 'personal') {
      return NextResponse.json({ 
        error: 'Cannot grant permissions on personal accounts' 
      }, { status: 400 });
    }

    // Crear permiso
    const { data: permission, error: permError } = await supabase
      .schema('crm')
      .from('email_account_permissions')
      .insert({
        email_account_id: id,
        user_id,
        can_send,
        can_receive,
        is_default,
        granted_by: userWithOrg.user.id
      })
      .select()
      .single();

    if (permError) {
      return NextResponse.json({ error: permError.message }, { status: 500 });
    }

    return NextResponse.json(permission, { status: 201 });
  } catch (error) {
    console.error('[POST /api/crm/email-accounts/[id]/permissions]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

