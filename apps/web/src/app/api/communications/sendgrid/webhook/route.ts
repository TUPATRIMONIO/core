/**
 * API Route: Webhook Handler de SendGrid
 * 
 * POST: Recibe eventos de SendGrid (delivered, opened, clicked, bounced, etc.)
 * y los guarda en message_events identificando la organización desde custom_args
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { SendGridWebhookEvent } from '@/lib/sendgrid/types';

// Mapeo de eventos de SendGrid a estados de email
const EVENT_TO_STATUS_MAP: Record<string, string> = {
  delivered: 'delivered',
  opened: 'opened',
  clicked: 'clicked',
  bounced: 'bounced',
  failed: 'failed',
  unsubscribed: 'unsubscribed',
  spamreport: 'bounced', // Tratamos spam como bounce
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const events: SendGridWebhookEvent[] = await request.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Procesar cada evento
    const processedEvents = [];

    for (const event of events) {
      try {
        // Obtener organization_id desde custom_args
        const organizationId = event.custom_args?.organization_id;
        const sendgridMessageId = event.sg_message_id;

        if (!organizationId || !sendgridMessageId) {
          console.warn('Evento sin organization_id o sg_message_id:', event);
          continue;
        }

        // Buscar campaign_message por sendgrid_message_id
        const { data: campaignMessage } = await supabase
          .from('campaign_messages')
          .select('id, campaign_id')
          .eq('sendgrid_message_id', sendgridMessageId)
          .single();

        if (!campaignMessage) {
          console.warn('No se encontró campaign_message para:', sendgridMessageId);
          continue;
        }

        // Determinar estado según evento
        const eventType = event.event;
        const status = EVENT_TO_STATUS_MAP[eventType] || 'sent';

        // Actualizar campaign_message según el evento
        const updateData: any = {
          updated_at: new Date(event.timestamp * 1000).toISOString(),
        };

        // Actualizar campos según tipo de evento
        const eventTimestamp = new Date(event.timestamp * 1000).toISOString();

        switch (eventType) {
          case 'delivered':
            updateData.status = 'delivered';
            updateData.delivered_at = eventTimestamp;
            break;
          case 'opened':
            updateData.status = 'opened';
            if (!campaignMessage.opened_at) {
              updateData.opened_at = eventTimestamp;
            }
            break;
          case 'clicked':
            updateData.status = 'clicked';
            if (!campaignMessage.clicked_at) {
              updateData.clicked_at = eventTimestamp;
            }
            break;
          case 'bounced':
          case 'spamreport':
            updateData.status = 'bounced';
            updateData.bounced_at = eventTimestamp;
            break;
          case 'failed':
            updateData.status = 'failed';
            updateData.failed_at = eventTimestamp;
            break;
        }

        // Actualizar campaign_message
        await supabase
          .from('campaign_messages')
          .update(updateData)
          .eq('id', campaignMessage.id);

        // Guardar evento en message_events
        const { error: eventError } = await supabase
          .from('message_events')
          .insert({
            campaign_message_id: campaignMessage.id,
            event_type: eventType as any,
            sendgrid_event_id: event.sg_event_id,
            event_data: {
              email: event.email,
              timestamp: event.timestamp,
              reason: event.reason,
              status: event.status,
              url: event.url,
              useragent: event.useragent,
              ip: event.ip,
              category: event.category,
            },
            occurred_at: eventTimestamp,
          });

        if (eventError) {
          console.error('Error al guardar evento:', eventError);
        } else {
          processedEvents.push(event.sg_event_id);
        }
      } catch (error: any) {
        console.error('Error al procesar evento individual:', error, event);
        // Continuar con el siguiente evento
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      events: processedEvents,
    });
  } catch (error: any) {
    console.error('Error al procesar webhook de SendGrid:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar webhook' },
      { status: 500 }
    );
  }
}

// Permitir POST sin autenticación (SendGrid envía webhooks sin auth)
export const runtime = 'nodejs';

