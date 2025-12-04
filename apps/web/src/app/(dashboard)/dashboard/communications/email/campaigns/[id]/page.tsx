'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Send, TrendingUp, Eye, MousePointerClick } from 'lucide-react';

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

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadCampaign();
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const response = await fetch(`/api/communications/campaigns/${campaignId}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setCampaign(data.data);
      }
    } catch (err: any) {
      setError('Error al cargar campaña');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (
      !confirm(
        `¿Estás seguro de que quieres enviar esta campaña a ${campaign?.total_recipients || 0} destinatarios?`
      )
    ) {
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/communications/campaigns/${campaignId}/send`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(
          `Campaña enviada exitosamente. ${data.data.sent} emails enviados, ${data.data.failed} fallidos.`
        );
        await loadCampaign(); // Recargar para ver estadísticas actualizadas
      }
    } catch (err: any) {
      setError('Error al enviar campaña');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-8">
        <p>Campaña no encontrada</p>
      </div>
    );
  }

  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaign.name}</h1>
          <p className="text-muted-foreground mt-2">{campaign.description || 'Sin descripción'}</p>
        </div>
        <Badge className={statusColors[campaign.status] || 'bg-gray-100 text-gray-800'}>
          {statusLabels[campaign.status] || campaign.status}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {canSend && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Campaña</CardTitle>
            <CardDescription>
              Esta campaña será enviada a {campaign.total_recipients || 0} destinatarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Campaña
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {campaign.status === 'sent' && campaign.stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviados</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.emails_sent || 0}</div>
              <p className="text-xs text-muted-foreground">
                de {campaign.total_recipients || 0} destinatarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.stats.open_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {campaign.emails_opened || 0} aperturas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Clics</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.stats.click_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">{campaign.emails_clicked || 0} clics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Rebote</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.stats.bounce_rate?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground">{campaign.emails_bounced || 0} rebotes</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{campaign.template?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lista de Contactos</p>
              <p className="font-medium">
                {campaign.contact_list?.name || 'N/A'} ({campaign.contact_list?.contact_count || 0}{' '}
                contactos)
              </p>
            </div>
            {campaign.scheduled_at && (
              <div>
                <p className="text-sm text-muted-foreground">Programada para</p>
                <p className="font-medium">
                  {new Date(campaign.scheduled_at).toLocaleString('es-CL')}
                </p>
              </div>
            )}
            {campaign.sent_at && (
              <div>
                <p className="text-sm text-muted-foreground">Enviada el</p>
                <p className="font-medium">{new Date(campaign.sent_at).toLocaleString('es-CL')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {campaign.status === 'sent' && campaign.messages && campaign.messages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Últimos Mensajes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {campaign.messages.slice(0, 10).map((message: any) => (
                  <div key={message.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="truncate">{message.email_address}</span>
                    <Badge variant="outline" className="text-xs">
                      {message.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





