'use client';

// =====================================================
// Page: Admin - Verification Detail
// Description: Detalle completo de una verificación (solo platform admins)
// =====================================================

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, Download,
  FileText, Image as ImageIcon, Video, AlertCircle, RefreshCw, Code,
} from 'lucide-react';
import type { VerificationSessionFull } from '@/types/identity-verification';
import { toast } from 'sonner';
import { VeriffApiPanel } from '@/components/admin/VeriffApiPanel';

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  started: { label: 'En Progreso', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  submitted: { label: 'Enviado', icon: Clock, color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Aprobado', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
  declined: { label: 'Rechazado', icon: XCircle, color: 'bg-red-100 text-red-800' },
  expired: { label: 'Expirado', icon: XCircle, color: 'bg-orange-100 text-orange-800' },
  abandoned: { label: 'Abandonado', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
  resubmission_requested: { label: 'Requiere Reenvío', icon: XCircle, color: 'bg-orange-100 text-orange-800' },
};

const mediaTypeLabels: Record<string, string> = {
  face_photo: 'Foto del Rostro',
  document_front: 'Documento (Frente)',
  document_back: 'Documento (Reverso)',
  selfie: 'Selfie',
  liveness_video: 'Video Liveness',
};

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [data, setData] = useState<VerificationSessionFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/verifications/${sessionId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (error) {
      console.error('Error cargando verificación:', error);
      toast.error('Error al cargar la verificación');
    } finally {
      setLoading(false);
    }
  };

  const downloadMedia = async (media: any) => {
    try {
      const response = await fetch(`/api/verifications/${sessionId}/media?path=${encodeURIComponent(media.storage_path)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.open(result.url, '_blank');
      toast.success('Descargando archivo...');
    } catch (error) {
      console.error('Error descargando media:', error);
      toast.error('Error al descargar archivo');
    }
  };

  const downloadAllEvidence = async () => {
    toast.info('Preparando descarga de toda la evidencia...');
    for (const media of data?.media || []) {
      await downloadMedia(media);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const refreshFromVeriff = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/verifications/${sessionId}/refresh`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      toast.success(`Datos actualizados: ${result.updated_fields} campos actualizados`);
      await loadData();
    } catch (error: any) {
      console.error('Error refrescando desde Veriff:', error);
      toast.error(error.message || 'Error al refrescar datos');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const session = data.session;
  const config = statusConfig[session.status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/verifications')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verificación de Identidad</h1>
            <p className="text-muted-foreground">{session.subject_name || session.subject_email}</p>
          </div>
        </div>
        <Badge variant="outline" className={config.color}>
          <Icon className="mr-1 h-4 w-4" />{config.label}
        </Badge>
      </div>

      {/* Info General */}
      <Card>
        <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div><p className="text-sm text-muted-foreground">Nombre Completo</p><p className="font-medium">{session.subject_name || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{session.subject_email || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">RUT/DNI</p><p className="font-medium font-mono">{session.subject_identifier || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Teléfono</p><p className="font-medium">{session.subject_phone || '-'}</p></div>
            </div>
            <div className="space-y-3">
              <div><p className="text-sm text-muted-foreground">Propósito</p><p className="font-medium capitalize">{session.purpose.replace('_', ' ')}</p></div>
              <div><p className="text-sm text-muted-foreground">Proveedor</p><p className="font-medium">{data.provider?.name || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">ID Sesión (Veriff)</p><p className="font-medium font-mono text-xs">{session.provider_session_id || '-'}</p></div>
              <div><p className="text-sm text-muted-foreground">Organización</p><p className="font-medium font-mono text-xs">{session.organization_id}</p></div>
              {session.metadata?.imported && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800">Importada</Badge>
              )}
            </div>
          </div>

          {session.risk_score !== null && (
            <div className="mt-6 rounded-md bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Score de Riesgo</p>
                  <p className="text-xs text-muted-foreground">0 = sin riesgo, 100 = alto riesgo</p>
                </div>
                <p className={`text-3xl font-bold ${session.risk_score < 30 ? 'text-green-600' : session.risk_score < 70 ? 'text-orange-600' : 'text-red-600'}`}>
                  {session.risk_score.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {session.decision_reason && (
            <div className="mt-4 rounded-md border p-4">
              <p className="text-sm font-medium mb-2">Razón de Decisión</p>
              <p className="text-sm text-muted-foreground">{session.decision_reason}</p>
              {session.decision_code && <p className="text-xs text-muted-foreground mt-1">Código: {session.decision_code}</p>}
            </div>
          )}

          {/* Raw Response */}
          {session.raw_response && Object.keys(session.raw_response).length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Ver datos crudos (raw_response)</summary>
              <div className="mt-2 rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
                <pre className="text-xs">{JSON.stringify(session.raw_response, null, 2)}</pre>
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" />Documentos ({data.documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="media"><ImageIcon className="mr-2 h-4 w-4" />Media ({data.media?.length || 0})</TabsTrigger>
          <TabsTrigger value="attempts"><AlertCircle className="mr-2 h-4 w-4" />Intentos ({data.attempts?.length || 0})</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="mr-2 h-4 w-4" />Timeline</TabsTrigger>
          <TabsTrigger value="veriff-api"><Code className="mr-2 h-4 w-4" />API Veriff</TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>Documentos de Identidad</CardTitle></CardHeader>
            <CardContent>
              {!data.documents || data.documents.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hay documentos capturados</p>
              ) : (
                <div className="space-y-4">
                  {data.documents.map((doc) => (
                    <div key={doc.id} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">{doc.document_country} • {doc.document_number}</p>
                        </div>
                        {doc.is_expired && <Badge variant="destructive">Expirado</Badge>}
                      </div>
                      <div className="grid gap-3 md:grid-cols-3 text-sm">
                        <div><p className="text-muted-foreground">Nombre</p><p className="font-medium">{doc.first_name} {doc.last_name}</p></div>
                        <div><p className="text-muted-foreground">Nacimiento</p><p className="font-medium">{doc.date_of_birth ? new Date(doc.date_of_birth).toLocaleDateString() : '-'}</p></div>
                        <div><p className="text-muted-foreground">Expiración</p><p className="font-medium">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-'}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Evidencia Multimedia</CardTitle>
                {data.media && data.media.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadAllEvidence}><Download className="mr-2 h-4 w-4" />Descargar Todo</Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!data.media || data.media.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hay archivos multimedia</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {data.media.map((media) => (
                    <Card key={media.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          {media.media_type.includes('video') ? <Video className="h-5 w-5 text-purple-600" /> : <ImageIcon className="h-5 w-5 text-blue-600" />}
                          <div>
                            <p className="font-medium text-sm">{mediaTypeLabels[media.media_type] || media.media_type}</p>
                            <p className="text-xs text-muted-foreground">{media.mime_type}</p>
                          </div>
                        </div>
                        {media.file_size && <p className="text-xs text-muted-foreground">Tamaño: {(media.file_size / 1024 / 1024).toFixed(2)} MB</p>}
                        <Button variant="outline" size="sm" className="w-full" onClick={() => downloadMedia(media)}>
                          <Download className="mr-2 h-4 w-4" />Descargar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attempts">
          <Card>
            <CardHeader><CardTitle>Intentos de Verificación</CardTitle></CardHeader>
            <CardContent>
              {!data.attempts || data.attempts.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hay intentos registrados</p>
              ) : (
                <div className="space-y-3">
                  {data.attempts.map((attempt) => (
                    <div key={attempt.id} className="rounded-md border p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">Intento #{attempt.attempt_number}</p>
                          <p className="text-sm text-muted-foreground">{new Date(attempt.started_at).toLocaleString()}</p>
                        </div>
                        <Badge variant={attempt.status === 'completed' ? 'default' : attempt.status === 'failed' ? 'destructive' : 'secondary'}>{attempt.status}</Badge>
                      </div>
                      {attempt.failure_reason && <div className="rounded-md bg-red-50 p-3 text-sm text-red-900">{attempt.failure_reason}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center"><div className="rounded-full bg-blue-100 p-2"><Clock className="h-4 w-4 text-blue-600" /></div><div className="h-full w-0.5 bg-border mt-2"></div></div>
                  <div className="pb-8"><p className="font-medium">Sesión Creada</p><p className="text-sm text-muted-foreground">{new Date(session.created_at).toLocaleString()}</p></div>
                </div>
                {session.verified_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="rounded-full bg-green-100 p-2"><CheckCircle2 className="h-4 w-4 text-green-600" /></div></div>
                    <div><p className="font-medium">Verificación Aprobada</p><p className="text-sm text-muted-foreground">{new Date(session.verified_at).toLocaleString()}</p></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="veriff-api">
          <VeriffApiPanel sessionId={sessionId} veriffSessionId={session.provider_session_id} organizationId={session.organization_id} />
        </TabsContent>
      </Tabs>

      {/* Acciones */}
      <Card>
        <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Recargar
            </Button>
            <Button variant="default" onClick={refreshFromVeriff} disabled={refreshing || !session.provider_session_id}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refrescar desde Veriff
            </Button>
            {data.media && data.media.length > 0 && (
              <Button variant="secondary" onClick={downloadAllEvidence}><Download className="mr-2 h-4 w-4" />Descargar Evidencia</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
