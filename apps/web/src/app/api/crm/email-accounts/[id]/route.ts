/**
 * API Route: /api/crm/email-accounts/[id]
 * Gestión de cuenta de email individual
 */

import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: account, error } = await supabase
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
    const supabase = await createClient();
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

    const { data: account, error } = await supabase
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
 * DELETE - Desconectar/eliminar cuenta
 */
export async function DELETE(
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

    const { error } = await supabase
      .schema('crm')
      .from('email_accounts')
      .delete()
      .eq('id', id)
      .eq('organization_id', userWithOrg.organizationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/crm/email-accounts/[id]]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

