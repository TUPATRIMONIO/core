/**
 * API Route: /api/crm/email-accounts
 * Gestión de cuentas de email del CRM (compartidas y personales)
 */

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

/**
 * GET - Obtener todas las cuentas de email disponibles para el usuario
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    console.log('[GET /api/crm/email-accounts] User:', userWithOrg?.user?.id, 'Org:', userWithOrg?.organizationId);
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener todas las cuentas de la organización
    // Usar Service Role para bypasear RLS (ya validamos permisos arriba)
    console.log('[GET /api/crm/email-accounts] Fetching accounts for org:', userWithOrg.organizationId);
    
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: accounts, error } = await supabaseAdmin
      .schema('crm')
      .from('email_accounts')
      .select('*')
      .eq('organization_id', userWithOrg.organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    console.log('[GET /api/crm/email-accounts] Query result:', { count: accounts?.length, error });

    if (error) {
      console.error('[GET /api/crm/email-accounts] Error fetching accounts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Formatear respuesta para el frontend
    const formattedAccounts = (accounts || []).map(account => ({
      account_id: account.id,
      email_address: account.email_address,
      display_name: account.display_name || account.email_address,
      account_type: account.account_type,
      is_default: account.is_default,
      can_send: true, // Por ahora todos pueden enviar (mejorar con permisos después)
      can_receive: true,
      ...account
    }));

    return NextResponse.json({ data: formattedAccounts });
  } catch (error) {
    console.error('[GET /api/crm/email-accounts] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Conectar una nueva cuenta de email
 * Body: { 
 *   email_address, 
 *   display_name, 
 *   account_type: 'shared' | 'personal',
 *   gmail_oauth_tokens 
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const userWithOrg = await getCurrentUserWithOrg();
    
    if (!userWithOrg || !userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email_address, display_name, account_type, gmail_oauth_tokens } = body;

    // Validaciones
    if (!email_address || !account_type || !gmail_oauth_tokens) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Preparar datos de inserción
    const insertData: any = {
      organization_id: userWithOrg.organizationId,
      email_address,
      display_name: display_name || email_address,
      account_type,
      gmail_oauth_tokens,
      gmail_email_address: gmail_oauth_tokens.email || email_address,
      connected_by: userWithOrg.user.id
    };

    // Si es cuenta personal, asignar owner
    if (account_type === 'personal') {
      insertData.owner_user_id = userWithOrg.user.id;
    }

    // Insertar cuenta
    const { data: account, error } = await supabase
      .schema('crm')
      .from('email_accounts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/crm/email-accounts] Error:', error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details
      }, { status: 500 });
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('[POST /api/crm/email-accounts] Exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

