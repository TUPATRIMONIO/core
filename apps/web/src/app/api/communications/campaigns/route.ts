/**
 * API Route: Campañas de Email Marketing
 * 
 * GET: Listar campañas de la organización
 * POST: Crear nueva campaña
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasSendGridAccount } from '@/lib/sendgrid/accounts';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Construir query
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        template:message_templates(id, name, subject),
        contact_list:contact_lists(id, name, contact_count)
      `)
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error al obtener campañas:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener campañas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    // Verificar que la organización tenga cuenta SendGrid configurada
    const hasAccount = await hasSendGridAccount(orgUser.organization_id);
    if (!hasAccount) {
      return NextResponse.json(
        {
          error:
            'Debes configurar una cuenta SendGrid antes de crear campañas. Ve a Configuración > SendGrid.',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, template_id, contact_list_id, scheduled_at } = body;

    // Validaciones
    if (!name || !template_id || !contact_list_id) {
      return NextResponse.json(
        { error: 'name, template_id y contact_list_id son campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el template pertenezca a la organización
    const { data: template } = await supabase
      .from('message_templates')
      .select('id, is_active')
      .eq('id', template_id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!template) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'El template no está activo' },
        { status: 400 }
      );
    }

    // Verificar que la lista pertenezca a la organización
    const { data: contactList } = await supabase
      .from('contact_lists')
      .select('id, contact_count')
      .eq('id', contact_list_id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!contactList) {
      return NextResponse.json({ error: 'Lista de contactos no encontrada' }, { status: 404 });
    }

    if (contactList.contact_count === 0) {
      return NextResponse.json(
        { error: 'La lista de contactos está vacía' },
        { status: 400 }
      );
    }

    // Crear campaña
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        organization_id: orgUser.organization_id,
        name,
        description: description || null,
        template_id,
        contact_list_id,
        status: scheduled_at ? 'scheduled' : 'draft',
        scheduled_at: scheduled_at || null,
        total_recipients: contactList.contact_count,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al crear campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear campaña' },
      { status: 500 }
    );
  }
}

