/**
 * API Route: Enviar Campaña
 * 
 * POST: Enviar una campaña usando SendGrid
 * 
 * Proceso:
 * 1. Validar que la campaña esté en estado draft o scheduled
 * 2. Obtener template y lista de contactos
 * 3. Renderizar template para cada contacto
 * 4. Enviar emails vía SendGrid en batch
 * 5. Crear campaign_messages para tracking
 * 6. Actualizar estadísticas de la campaña
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendBatchEmails } from '@/lib/sendgrid/client';
import { renderTemplate } from '@/lib/communications/template-engine';
import { hasSendGridAccount } from '@/lib/sendgrid/accounts';
import type { SendGridMessage } from '@/lib/sendgrid/types';
import { requireApplicationAccess } from '@/lib/access/api-access-guard';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar acceso a Email Marketing
  const denied = await requireApplicationAccess(request, 'email_marketing');
  if (denied) return denied;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const serviceSupabase = createServiceRoleClient();
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

    // Verificar cuenta SendGrid
    const hasAccount = await hasSendGridAccount(orgUser.organization_id);
    if (!hasAccount) {
      return NextResponse.json(
        {
          error:
            'Debes configurar una cuenta SendGrid antes de enviar campañas. Ve a Configuración > SendGrid.',
        },
        { status: 400 }
      );
    }

    // Obtener campaña con template y lista
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

    // Validar estado
    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: `No se puede enviar una campaña con estado "${campaign.status}"` },
        { status: 400 }
      );
    }

    // Obtener contactos de la lista
    const { data: listMembers } = await serviceSupabase
      .from('contact_list_members')
      .select(`
        contact:crm.contacts(*)
      `)
      .eq('contact_list_id', campaign.contact_list_id);

    if (!listMembers || listMembers.length === 0) {
      return NextResponse.json(
        { error: 'La lista de contactos está vacía' },
        { status: 400 }
      );
    }

    // Actualizar estado de campaña a "sending"
    await serviceSupabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', id);

    // Preparar mensajes para enviar
    const messages: SendGridMessage[] = [];
    const campaignMessages: any[] = [];

    for (const member of listMembers) {
      const contact = (member as any).contact;
      if (!contact || !contact.email) continue;

      // Preparar variables para el template
      const variables = {
        contact: {
          name: contact.full_name || contact.first_name || contact.email,
          email: contact.email,
          first_name: contact.first_name,
          last_name: contact.last_name,
          company_name: contact.company_name,
          phone: contact.phone,
        },
        organization: {
          name: campaign.contact_list?.name || 'Tu Organización',
        },
      };

      // Renderizar template
      const renderedSubject = renderTemplate(campaign.template.subject, variables);
      const renderedHtml = renderTemplate(campaign.template.body_html, variables);
      const renderedText = campaign.template.body_text
        ? renderTemplate(campaign.template.body_text, variables)
        : undefined;

      // Agregar mensaje
      messages.push({
        to: contact.email,
        subject: renderedSubject,
        html: renderedHtml,
        text: renderedText,
        customArgs: {
          campaign_id: id,
          contact_id: contact.id,
        },
      });

      // Preparar campaign_message para tracking
      campaignMessages.push({
        campaign_id: id,
        contact_id: contact.id,
        email_address: contact.email,
        status: 'draft',
      });
    }

    // Crear campaign_messages en BD antes de enviar
    const { data: createdMessages, error: messagesError } = await serviceSupabase
      .from('campaign_messages')
      .insert(campaignMessages)
      .select('id, email_address');

    if (messagesError) {
      console.error('Error al crear campaign_messages:', messagesError);
      // Continuar de todas formas
    }

    // Enviar emails en batch
    try {
      const responses = await sendBatchEmails(orgUser.organization_id, messages, {
        campaign_id: id,
      });

      // Actualizar campaign_messages con sendgrid_message_id
      // Nota: SendGrid no retorna message_id individual en batch, así que actualizamos el status
      if (createdMessages) {
        for (let i = 0; i < createdMessages.length; i++) {
          const response = responses[i];
          if (response && response.statusCode >= 200 && response.statusCode < 300) {
            await serviceSupabase
              .from('campaign_messages')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
              .eq('id', createdMessages[i].id);
          } else {
            await serviceSupabase
              .from('campaign_messages')
              .update({
                status: 'failed',
                failed_at: new Date().toISOString(),
              })
              .eq('id', createdMessages[i].id);
          }
        }
      }

      // Actualizar campaña
      const emailsSent = responses.filter((r) => r.statusCode >= 200 && r.statusCode < 300).length;
      const emailsFailed = responses.length - emailsSent;

      await serviceSupabase
        .from('campaigns')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          emails_sent: emailsSent,
          emails_failed: emailsFailed,
        })
        .eq('id', id);

      return NextResponse.json({
        success: true,
        data: {
          total: messages.length,
          sent: emailsSent,
          failed: emailsFailed,
        },
      });
    } catch (sendError: any) {
      // Si falla el envío, actualizar campaña a error
      await serviceSupabase
        .from('campaigns')
        .update({
          status: 'draft', // Volver a draft para poder reintentar
        })
        .eq('id', id);

      throw sendError;
    }
  } catch (error: any) {
    console.error('Error al enviar campaña:', error);
    return NextResponse.json(
      { error: error.message || 'Error al enviar campaña' },
      { status: 500 }
    );
  }
}

