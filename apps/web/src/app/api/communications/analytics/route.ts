/**
 * API Route: Analytics de Comunicaciones
 * 
 * GET: Obtener estadísticas y métricas de campañas
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const campaignId = searchParams.get('campaign_id');

    // Construir query de campañas
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', orgUser.organization_id)
      .eq('status', 'sent');

    if (startDate) {
      campaignsQuery = campaignsQuery.gte('sent_at', startDate);
    }
    if (endDate) {
      campaignsQuery = campaignsQuery.lte('sent_at', endDate);
    }
    if (campaignId) {
      campaignsQuery = campaignsQuery.eq('id', campaignId);
    }

    const { data: campaigns } = await campaignsQuery;

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        data: {
          total_campaigns: 0,
          total_emails_sent: 0,
          total_emails_delivered: 0,
          total_emails_opened: 0,
          total_emails_clicked: 0,
          total_emails_bounced: 0,
          average_open_rate: 0,
          average_click_rate: 0,
          average_bounce_rate: 0,
          campaigns: [],
        },
      });
    }

    // Calcular estadísticas agregadas
    const totalCampaigns = campaigns.length;
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0);
    const totalEmailsDelivered = campaigns.reduce((sum, c) => sum + (c.emails_delivered || 0), 0);
    const totalEmailsOpened = campaigns.reduce((sum, c) => sum + (c.emails_opened || 0), 0);
    const totalEmailsClicked = campaigns.reduce((sum, c) => sum + (c.emails_clicked || 0), 0);
    const totalEmailsBounced = campaigns.reduce((sum, c) => sum + (c.emails_bounced || 0), 0);

    // Calcular tasas promedio
    const averageOpenRate =
      totalEmailsDelivered > 0 ? (totalEmailsOpened / totalEmailsDelivered) * 100 : 0;
    const averageClickRate =
      totalEmailsDelivered > 0 ? (totalEmailsClicked / totalEmailsDelivered) * 100 : 0;
    const averageBounceRate =
      totalEmailsSent > 0 ? (totalEmailsBounced / totalEmailsSent) * 100 : 0;

    // Calcular estadísticas por campaña
    const campaignsWithStats = campaigns.map((campaign) => {
      const openRate =
        campaign.emails_delivered > 0
          ? (campaign.emails_opened / campaign.emails_delivered) * 100
          : 0;
      const clickRate =
        campaign.emails_delivered > 0
          ? (campaign.emails_clicked / campaign.emails_delivered) * 100
          : 0;
      const bounceRate =
        campaign.emails_sent > 0 ? (campaign.emails_bounced / campaign.emails_sent) * 100 : 0;
      const deliveryRate =
        campaign.emails_sent > 0
          ? (campaign.emails_delivered / campaign.emails_sent) * 100
          : 0;

      return {
        ...campaign,
        stats: {
          open_rate: openRate,
          click_rate: clickRate,
          bounce_rate: bounceRate,
          delivery_rate: deliveryRate,
        },
      };
    });

    return NextResponse.json({
      data: {
        total_campaigns: totalCampaigns,
        total_emails_sent: totalEmailsSent,
        total_emails_delivered: totalEmailsDelivered,
        total_emails_opened: totalEmailsOpened,
        total_emails_clicked: totalEmailsClicked,
        total_emails_bounced: totalEmailsBounced,
        average_open_rate: averageOpenRate,
        average_click_rate: averageClickRate,
        average_bounce_rate: averageBounceRate,
        campaigns: campaignsWithStats,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener analytics' },
      { status: 500 }
    );
  }
}

