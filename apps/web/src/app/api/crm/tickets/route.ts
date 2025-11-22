import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/crm/tickets
 * Obtener lista de tickets
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
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
        { status: 400 }
      );
    }

    // Obtener tickets
    const { data: tickets, error } = await supabase
      .from('crm.tickets')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json(
        { error: error.message || 'Error obteniendo tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json(tickets || []);
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/crm/tickets
 * Crear un nuevo ticket
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
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
        { status: 400 }
      );
    }

    // Validar campos requeridos
    if (!body.subject || !body.description) {
      return NextResponse.json(
        { error: 'El asunto y la descripción son requeridos' },
        { status: 400 }
      );
    }

    // Generar número de ticket (usar función SQL si existe, sino generar manualmente)
    const { count } = await supabase
      .from('crm.tickets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgUser.organization_id);

    const ticketNumber = `TICK-${String((count || 0) + 1).padStart(5, '0')}`;

    // Preparar datos para insertar
    const insertData: any = {
      organization_id: orgUser.organization_id,
      ticket_number: ticketNumber,
      subject: body.subject,
      description: body.description,
      status: body.status || 'new',
      priority: body.priority || 'medium',
      category: body.category || 'general',
      contact_id: body.contact_id || null,
      company_id: body.company_id || null,
      due_date: body.due_date || null,
      created_by: user.id,
    };

    // Crear ticket
    const { data: newTicket, error } = await supabase
      .from('crm.tickets')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return NextResponse.json(
        { error: error.message || 'Error creando ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

