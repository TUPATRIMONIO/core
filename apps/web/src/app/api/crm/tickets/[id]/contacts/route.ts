/**
 * API Route: /api/crm/tickets/[id]/contacts
 * Gestión de contactos asociados a un ticket
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCurrentUserWithOrg } from '@/lib/crm/permissions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar que el ticket pertenece a la organización
    const { data: ticket } = await supabase
      .schema('crm')
      .from('tickets')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!ticket || ticket.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Obtener contactos del ticket
    // Primero intentar con query directa
    const { data: ticketContacts, error: queryError } = await supabase
      .schema('crm')
      .from('ticket_contacts')
      .select('contact_id, contact_role, added_at')
      .eq('ticket_id', id)
      .order('added_at', { ascending: true });

    if (queryError) {
      // Si la tabla no existe, intentar con función SQL como fallback
      if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_ticket_contacts', {
          p_ticket_id: id
        });

        if (rpcError) {
          console.error('Error fetching ticket contacts (both methods failed):', rpcError);
          return NextResponse.json({ 
            error: 'La tabla ticket_contacts no existe. Por favor aplica la migración 20251117215900_ticket_email_integration.sql',
            details: rpcError.message 
          }, { status: 500 });
        }

        return NextResponse.json(rpcData || []);
      }

      console.error('Error fetching ticket contacts:', queryError);
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Si no hay contactos, retornar array vacío
    if (!ticketContacts || ticketContacts.length === 0) {
      return NextResponse.json([]);
    }

    // Obtener datos completos de los contactos
    const contactIds = ticketContacts.map(tc => tc.contact_id);
    const { data: contacts, error: contactsError } = await supabase
      .schema('crm')
      .from('contacts')
      .select('id, full_name, email, phone, company_name')
      .in('id', contactIds);

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return NextResponse.json({ error: contactsError.message }, { status: 500 });
    }

    // Combinar datos
    const formattedContacts = ticketContacts.map((tc: any) => {
      const contact = contacts?.find((c: any) => c.id === tc.contact_id);
      return {
        contact_id: tc.contact_id,
        full_name: contact?.full_name || '',
        email: contact?.email || '',
        phone: contact?.phone || null,
        company_name: contact?.company_name || null,
        contact_role: tc.contact_role,
        added_at: tc.added_at
      };
    });

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Error in GET /api/crm/tickets/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const userWithOrg = await getCurrentUserWithOrg();
  
  if (!userWithOrg || !userWithOrg.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Verificar que el ticket pertenece a la organización
    const { data: ticket } = await supabase
      .schema('crm')
      .from('tickets')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!ticket || ticket.organization_id !== userWithOrg.organizationId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const { contact_id, contact_role = 'affected' } = body;

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id is required' }, { status: 400 });
    }

    // Verificar que el contacto pertenece a la organización
    const { data: contact } = await supabase
      .schema('crm')
      .from('contacts')
      .select('id')
      .eq('id', contact_id)
      .eq('organization_id', userWithOrg.organizationId)
      .single();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found in organization' }, { status: 400 });
    }

    // Verificar si el contacto ya está asociado al ticket
    const { data: existing } = await supabase
      .schema('crm')
      .from('ticket_contacts')
      .select('id, contact_role')
      .eq('ticket_id', id)
      .eq('contact_id', contact_id)
      .single();

    let ticketContact;
    let insertError;

    if (existing) {
      // Actualizar rol si ya existe
      const { data: updated, error: updateError } = await supabase
        .schema('crm')
        .from('ticket_contacts')
        .update({
          contact_role: contact_role,
          added_by: userWithOrg.user.id
        })
        .eq('id', existing.id)
        .select()
        .single();

      ticketContact = updated;
      insertError = updateError;
    } else {
      // Agregar contacto al ticket directamente en la tabla
      const { data: inserted, error: insertErr } = await supabase
        .schema('crm')
        .from('ticket_contacts')
        .insert({
          ticket_id: id,
          contact_id: contact_id,
          contact_role: contact_role,
          added_by: userWithOrg.user.id
        })
        .select()
        .single();

      ticketContact = inserted;
      insertError = insertErr;
    }

    if (insertError) {
      // Si la tabla no existe, intentar usar función SQL como fallback
      if (insertError.code === '42P01' || insertError.message.includes('does not exist')) {
        // Tabla no existe, intentar con función SQL
        const { data: rpcData, error: rpcError } = await supabase.rpc('add_contact_to_ticket', {
          p_ticket_id: id,
          p_contact_id: contact_id,
          p_contact_role: contact_role,
          p_added_by: userWithOrg.user.id
        });

        if (rpcError) {
          console.error('Error adding contact to ticket (both methods failed):', rpcError);
          return NextResponse.json({ 
            error: 'La tabla ticket_contacts no existe. Por favor aplica la migración 20251117215900_ticket_email_integration.sql',
            details: rpcError.message 
          }, { status: 500 });
        }

        // Retornar datos del contacto agregado
        const { data: contactData } = await supabase
          .schema('crm')
          .from('contacts')
          .select('id, full_name, email, phone, company_name')
          .eq('id', contact_id)
          .single();

        return NextResponse.json({
          id: rpcData,
          contact: contactData,
          contact_role,
          added_at: new Date().toISOString()
        }, { status: 201 });
      }

      console.error('Error adding contact to ticket:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Retornar datos del contacto agregado
    const { data: contactData } = await supabase
      .schema('crm')
      .from('contacts')
      .select('id, full_name, email, phone, company_name')
      .eq('id', contact_id)
      .single();

    return NextResponse.json({
      id: ticketContact.id,
      contact: contactData,
      contact_role,
      added_at: ticketContact.added_at || new Date().toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/crm/tickets/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
