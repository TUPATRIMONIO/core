/**
 * API Route: Importar Contactos desde CSV
 * 
 * POST: Importar múltiples contactos desde un archivo CSV
 * 
 * Formato CSV esperado:
 * email,first_name,last_name,phone,company_name
 * 
 * El email es obligatorio, los demás campos son opcionales.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export async function POST(request: NextRequest) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

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
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!orgUser) {
      return NextResponse.json(
        { error: 'Usuario no pertenece a ninguna organización' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { contacts } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'contacts debe ser un array con al menos un contacto' },
        { status: 400 }
      );
    }

    // Validar y preparar contactos
    const contactsToInsert: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const { email, first_name, last_name, phone, company_name } = contact;

      // Validar email
      if (!email || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
        errors.push(`Fila ${i + 1}: Email inválido o faltante`);
        continue;
      }

      contactsToInsert.push({
        organization_id: orgUser.organization_id,
        email: email.toLowerCase().trim(),
        first_name: first_name?.trim() || null,
        last_name: last_name?.trim() || null,
        phone: phone?.trim() || null,
        company_name: company_name?.trim() || null,
        created_by: user.id,
        status: 'lead',
        source: 'email_marketing_import',
      });
    }

    if (contactsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'No hay contactos válidos para importar', errors },
        { status: 400 }
      );
    }

    // Obtener emails existentes para evitar duplicados
    const emailsToCheck = contactsToInsert.map((c) => c.email);
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('email')
      .eq('organization_id', orgUser.organization_id)
      .in('email', emailsToCheck);

    const existingEmails = new Set(existingContacts?.map((c) => c.email) || []);

    // Filtrar contactos que ya existen
    const newContacts = contactsToInsert.filter((c) => !existingEmails.has(c.email));
    const skippedCount = contactsToInsert.length - newContacts.length;

    if (newContacts.length === 0) {
      return NextResponse.json(
        {
          data: {
            imported: 0,
            skipped: skippedCount,
            errors: errors.length > 0 ? errors : undefined,
          },
          message: 'Todos los contactos ya existen',
        },
        { status: 200 }
      );
    }

    // Insertar contactos nuevos
    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(newContacts)
      .select('id, email, first_name, last_name, full_name');

    if (insertError) {
      console.error('Error al importar contactos:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Error al importar contactos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        imported: insertedContacts?.length || 0,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
      contacts: insertedContacts,
    });
  } catch (error: any) {
    console.error('Error en POST /api/communications/contacts/import:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





