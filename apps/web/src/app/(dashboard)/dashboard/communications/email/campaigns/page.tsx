import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, TrendingUp } from 'lucide-react';
import Link from 'next/link';

async function getCampaigns() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/communications/campaigns`, {
    cache: 'no-store',
  });
  const { data } = await response.json();
  return data || [];
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  sending: 'Enviando',
  sent: 'Enviada',
  paused: 'Pausada',
  cancelled: 'Cancelada',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-green-100 text-green-800',
  paused: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campañas de Email</h1>
          <p className="text-muted-foreground mt-2">
            Crea y gestiona campañas de email marketing masivo
          </p>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Link href="/dashboard/communications/email/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Link>
        </Button>
      </div>

      {campaigns && campaigns.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign: any) => {
            const openRate =
              campaign.total_recipients > 0
                ? ((campaign.emails_opened || 0) / campaign.total_recipients) * 100
                : 0;
            const clickRate =
              campaign.total_recipients > 0
                ? ((campaign.emails_clicked || 0) / campaign.total_recipients) * 100
                : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    </div>
                    <Badge className={statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}>
                      {statusLabels[campaign.status] || campaign.status}
                    </Badge>
                  </div>
                  {campaign.description && (
                    <CardDescription className="mt-2">{campaign.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaign.status === 'sent' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Enviados</p>
                          <p className="font-semibold">{campaign.emails_sent || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Destinatarios</p>
                          <p className="font-semibold">{campaign.total_recipients || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Apertura</p>
                          <p className="font-semibold flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {openRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Clics</p>
                          <p className="font-semibold">{clickRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}
                    {campaign.status !== 'sent' && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">
                          Destinatarios: <span className="font-semibold">{campaign.total_recipients || 0}</span>
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/dashboard/communications/email/campaigns/${campaign.id}`}>Ver Detalles</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay campañas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera campaña de email marketing
              </p>
              <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
                <Link href="/dashboard/communications/email/campaigns/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Campaña
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

