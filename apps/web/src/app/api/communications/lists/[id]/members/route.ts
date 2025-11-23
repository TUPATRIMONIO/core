/**
 * API Route: Miembros de Lista
 * 
 * GET: Obtener miembros de una lista
 * POST: Agregar miembros a una lista
 * DELETE: Remover miembros de una lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que la lista pertenezca a la organización
    const { data: list } = await supabase
      .from('contact_lists')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });
    }

    // Obtener miembros
    const { data, error } = await supabase
      .from('contact_list_members')
      .select(`
        id,
        added_at,
        contact:crm.contacts (
          id,
          email,
          first_name,
          last_name,
          full_name,
          company_name,
          status
        )
      `)
      .eq('contact_list_id', id)
      .order('added_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Error al obtener miembros:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener miembros' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que la lista pertenezca a la organización
    const { data: list } = await supabase
      .from('contact_lists')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const { contact_ids } = body; // Array de IDs de contactos

    if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids debe ser un array con al menos un contacto' },
        { status: 400 }
      );
    }

    // Verificar que los contactos pertenezcan a la organización
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('organization_id', orgUser.organization_id)
      .in('id', contact_ids);

    if (!contacts || contacts.length !== contact_ids.length) {
      return NextResponse.json(
        { error: 'Algunos contactos no pertenecen a tu organización' },
        { status: 400 }
      );
    }

    // Preparar inserts (evitar duplicados)
    const membersToInsert = contact_ids.map((contactId: string) => ({
      contact_list_id: id,
      contact_id: contactId,
      added_by: user.id,
    }));

    // Insertar miembros (ignorar duplicados)
    const { data, error } = await supabase
      .from('contact_list_members')
      .upsert(membersToInsert, {
        onConflict: 'contact_list_id,contact_id',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error al agregar miembros:', error);
    return NextResponse.json(
      { error: error.message || 'Error al agregar miembros' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verificar que la lista pertenezca a la organización
    const { data: list } = await supabase
      .from('contact_lists')
      .select('id')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!list) {
      return NextResponse.json({ error: 'Lista no encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');
    const contactId = searchParams.get('contact_id');

    if (!memberId && !contactId) {
      return NextResponse.json(
        { error: 'member_id o contact_id es requerido' },
        { status: 400 }
      );
    }

    // Eliminar miembro
    let deleteQuery = supabase
      .from('contact_list_members')
      .delete()
      .eq('contact_list_id', id);

    if (memberId) {
      deleteQuery = deleteQuery.eq('id', memberId);
    } else if (contactId) {
      deleteQuery = deleteQuery.eq('contact_id', contactId);
    }

    const { error } = await deleteQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al remover miembro:', error);
    return NextResponse.json(
      { error: error.message || 'Error al remover miembro' },
      { status: 500 }
    );
  }
}

