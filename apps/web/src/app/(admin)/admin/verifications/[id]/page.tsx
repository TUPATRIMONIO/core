'use client';

// =====================================================
// Page: Admin - Verification Detail
// Description: Detalle completo de una verificación (solo platform admins)
// =====================================================

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, Download,
  RefreshCw, User, FileText, Image as ImageIcon, Video, ShieldCheck
} from 'lucide-react';
import type { VerificationSessionFull } from '@/types/identity-verification';
import { toast } from 'sonner';

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
  const [veriffMedia, setVeriffMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => { loadData(); }, [sessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/verifications/${sessionId}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      
      // Si hay session ID de Veriff, cargar media directamente
      if (result.session?.provider_session_id) {
        loadVeriffMedia(result.session.provider_session_id, result.session.organization_id);
      }
    } catch (error) {
      console.error('Error cargando verificación:', error);
      toast.error('Error al cargar la verificación');
    } finally {
      setLoading(false);
    }
  };

  const loadVeriffMedia = async (veriffSessionId: string, organizationId: string) => {
    setLoadingMedia(true);
    try {
      const response = await fetch('/api/verifications/query-veriff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veriffSessionId, dataType: 'media', organizationId }),
      });
      const result = await response.json();
      if (response.ok && result.data?.images) {
        setVeriffMedia(result.data.images);
      }
    } catch (error) {
      console.error('Error cargando media de Veriff:', error);
    } finally {
      setLoadingMedia(false);
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

  // Proxy URL para cargar imágenes de Veriff con autenticación
  const getProxyUrl = (originalUrl: string) => {
    return `/api/verifications/proxy-media?url=${encodeURIComponent(originalUrl)}`;
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
  // Extraer status desde attempts si no hay decision
  const attemptsStatus = session.raw_response?.attempts?.verifications?.[0]?.status;
  const rawStatus = session.status === 'pending' && attemptsStatus ? attemptsStatus : session.status;
  const config = statusConfig[rawStatus] || statusConfig.pending;
  const Icon = config.icon;

  // Extraer datos del webhook si las tablas están vacías
  const webhookData = session.raw_response?.webhook?.data?.verification;
  const apiPerson = session.raw_response?.person?.person || session.raw_response?.person;
  const apiDoc = session.raw_response?.decision?.document;
  
  // Si no hay media de la API, usar las de raw_response
  if (veriffMedia.length === 0) {
    const savedMedia = result.session?.raw_response?.media?.images;
    if (savedMedia?.length > 0) setVeriffMedia(savedMedia);
  }

  const personInfo = {
    firstName: data.documents?.[0]?.first_name 
      || webhookData?.person?.firstName?.value 
      || apiPerson?.firstName 
      || session.subject_name?.split(' ')?.[0] 
      || '-',
    lastName: data.documents?.[0]?.last_name 
      || webhookData?.person?.lastName?.value 
      || apiPerson?.lastName 
      || '-',
    dob: data.documents?.[0]?.date_of_birth 
      || webhookData?.person?.dateOfBirth?.value 
      || apiPerson?.dateOfBirth 
      || '-',
    gender: webhookData?.person?.gender?.value 
      || apiPerson?.gender 
      || '-',
    nationality: data.documents?.[0]?.document_country 
      || webhookData?.person?.nationality?.value 
      || apiPerson?.nationality 
      || '-',
    idNumber: data.documents?.[0]?.document_number 
      || webhookData?.person?.idNumber?.value 
      || apiPerson?.idNumber 
      || apiPerson?.idCode
      || session.subject_identifier 
      || '-',
  };

  const docInfo = {
    type: data.documents?.[0]?.document_type 
      || webhookData?.document?.type?.value 
      || apiDoc?.type 
      || '-',
    number: data.documents?.[0]?.document_number 
      || webhookData?.document?.number?.value 
      || apiDoc?.number 
      || apiPerson?.idCode
      || '-',
    country: data.documents?.[0]?.document_country 
      || webhookData?.document?.country?.value 
      || apiDoc?.country 
      || apiPerson?.nationality
      || '-',
    validUntil: data.documents?.[0]?.expiry_date 
      || webhookData?.document?.validUntil?.value 
      || apiDoc?.validUntil 
      || '-',
  };

  return (
    <div className="py-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/verifications')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Verificación de Identidad</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={config.color}>
                <Icon className="mr-1 h-4 w-4" />{config.label}
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">{session.provider_session_id}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="default" onClick={refreshFromVeriff} disabled={refreshing || !session.provider_session_id}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refrescar
          </Button>
        </div>
      </div>

      {/* Datos de la Persona */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle>Datos Personales</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium text-lg">{personInfo.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Apellido</p>
              <p className="font-medium text-lg">{personInfo.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RUT/DNI</p>
              <p className="font-medium text-lg font-mono">{personInfo.idNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nacionalidad</p>
              <p className="font-medium text-lg">{personInfo.nationality}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha Nacimiento</p>
              <p className="font-medium">{personInfo.dob}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Género</p>
              <p className="font-medium capitalize">{personInfo.gender}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Documento */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <CardTitle>Documento de Identidad</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium capitalize">{docInfo.type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número</p>
              <p className="font-medium font-mono">{docInfo.number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">País</p>
              <p className="font-medium">{docInfo.country}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vence</p>
              <p className="font-medium">{docInfo.validUntil}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fotografías */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-green-600" />
              <CardTitle>Evidencia Fotográfica</CardTitle>
            </div>
            {loadingMedia && <span className="text-xs text-muted-foreground animate-pulse">Cargando fotos...</span>}
          </div>
        </CardHeader>
        <CardContent>
          {veriffMedia.length === 0 && !loadingMedia ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              No hay fotografías disponibles
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {veriffMedia.map((media, idx) => (
                <div key={media.id || idx} className="rounded-lg border overflow-hidden bg-muted/30">
                  <div className="aspect-video relative bg-black/5 flex items-center justify-center">
                    {media.mimeType?.startsWith('video') ? (
                      <div className="text-center">
                        <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Video</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={getProxyUrl(media.url)} 
                        alt={media.context || `Imagen ${idx + 1}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-3 border-t bg-white">
                    <p className="font-medium text-sm capitalize mb-1">
                      {(media.context || 'desconocido').replace(/-/g, ' ')}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">{media.mimeType}</span>
                      <a 
                        href={getProxyUrl(media.url)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" /> Abrir
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalles Técnicos (Colapsable) */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer p-4 font-medium text-muted-foreground hover:text-foreground">
          <ShieldCheck className="h-4 w-4" /> Ver detalles técnicos y JSON crudo
        </summary>
        <div className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div><p className="text-muted-foreground">Score Riesgo</p><p className="font-mono">{session.risk_score ?? '-'}</p></div>
            <div><p className="text-muted-foreground">Razón</p><p>{session.decision_reason || '-'}</p></div>
            <div><p className="text-muted-foreground">Código</p><p className="font-mono">{session.decision_code || '-'}</p></div>
            <div><p className="text-muted-foreground">IP</p><p className="font-mono">{webhookData?.technicalData?.ip || '-'}</p></div>
          </div>
          <div className="rounded-md bg-muted p-4 overflow-auto max-h-[300px]">
            <pre className="text-xs font-mono">{JSON.stringify(session.raw_response, null, 2)}</pre>
          </div>
        </div>
      </details>
    </div>
  );
}
