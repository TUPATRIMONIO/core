/**
 * API Route: Campaña Individual
 * 
 * GET: Obtener campaña por ID con estadísticas
 * PATCH: Actualizar campaña
 * DELETE: Eliminar campaña
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

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

    // Obtener campaña con relaciones
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        template:message_templates(*),
        contact_list:contact_lists(*)
      `)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Obtener mensajes de la campaña
    const { data: messages } = await supabase
      .from('campaign_messages')
      .select('*')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false })
      .limit(100); // Limitar a los últimos 100 mensajes

    // Calcular estadísticas adicionales
    const stats = {
      open_rate: campaign.total_recipients > 0
        ? (campaign.emails_opened / campaign.total_recipients) * 100
        : 0,
      click_rate: campaign.total_recipients > 0
        ? (campaign.emails_clicked / campaign.total_recipients) * 100
        : 0,
      bounce_rate: campaign.total_recipients > 0
        ? (campaign.emails_bounced / campaign.total_recipients) * 100
        : 0,
      delivery_rate: campaign.total_recipients > 0
        ? (campaign.emails_delivered / campaign.total_recipients) * 100
        : 0,
    };

    return NextResponse.json({
      data: {
        ...campaign,
        messages: messages || [],
        stats,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener campaña' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

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

    const body = await request.json();
    const { name, description, scheduled_at, status } = body;

    // Verificar que la campaña pertenezca a la organización
    const { data: existingCampaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Validaciones de estado
    if (status === 'sent' && existingCampaign.status !== 'sent') {
      return NextResponse.json(
        { error: 'No se puede cambiar el estado a "sent" manualmente' },
        { status: 400 }
      );
    }

    if (existingCampaign.status === 'sent') {
      return NextResponse.json(
        { error: 'No se puede modificar una campaña ya enviada' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (scheduled_at !== undefined) {
      updateData.scheduled_at = scheduled_at;
      updateData.status = scheduled_at ? 'scheduled' : 'draft';
    }
    if (status !== undefined) updateData.status = status;

    // Actualizar campaña
    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error al actualizar campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar campaña' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

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

    // Verificar que la campaña pertenezca a la organización y no esté enviada
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('status')
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'No se puede eliminar una campaña ya enviada' },
        { status: 400 }
      );
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'No se puede eliminar una campaña que está siendo enviada' },
        { status: 400 }
      );
    }

    // Eliminar campaña (los mensajes se eliminan automáticamente por CASCADE)
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgUser.organization_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar campaña' },
      { status: 500 }
    );
  }
}

