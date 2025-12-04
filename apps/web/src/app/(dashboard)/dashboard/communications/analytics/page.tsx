import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Mail, Eye, MousePointerClick, AlertTriangle } from 'lucide-react';

async function getAnalytics() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/communications/analytics`, {
    cache: 'no-store',
  });
  const { data } = await response.json();
  return data || {
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
  };
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics de Comunicaciones</h1>
        <p className="text-muted-foreground mt-2">
          Estadísticas y métricas de tus campañas de marketing
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campañas Enviadas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_campaigns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_emails_sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_open_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_emails_opened} de {analytics.total_emails_delivered} entregados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Clics</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_click_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.total_emails_clicked} clics totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas Adicionales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.total_emails_sent > 0
                ? ((analytics.total_emails_delivered / analytics.total_emails_sent) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.total_emails_delivered} de {analytics.total_emails_sent} enviados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tasa de Rebote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.average_bounce_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.total_emails_bounced} rebotes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Emails Fallidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.campaigns.reduce(
                (sum: number, c: any) => sum + (c.emails_failed || 0),
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Campañas */}
      {analytics.campaigns && analytics.campaigns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campañas Recientes</CardTitle>
            <CardDescription>Estadísticas detalladas por campaña</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.campaigns.slice(0, 10).map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Enviada el{' '}
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleDateString('es-CL')
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm text-center">
                    <div>
                      <p className="text-muted-foreground">Enviados</p>
                      <p className="font-semibold">{campaign.emails_sent || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Apertura</p>
                      <p className="font-semibold">{campaign.stats?.open_rate?.toFixed(1) || 0}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clics</p>
                      <p className="font-semibold">{campaign.stats?.click_rate?.toFixed(1) || 0}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rebotes</p>
                      <p className="font-semibold">{campaign.stats?.bounce_rate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.total_campaigns === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay datos aún</h3>
              <p className="text-muted-foreground">
                Las estadísticas aparecerán aquí una vez que envíes tu primera campaña
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





