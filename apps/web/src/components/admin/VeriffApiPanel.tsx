'use client';

// =====================================================
// Component: VeriffApiPanel
// Description: Panel para consultar datos crudos de Veriff API
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Loader2, RefreshCw, User, ListChecks, ShieldCheck, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface VeriffApiPanelProps {
  sessionId: string;
  veriffSessionId: string | null;
  organizationId?: string;
}

type DataType = 'all' | 'person' | 'attempts' | 'decision' | 'media';

const dataTypeLabels: Record<DataType, string> = {
  all: 'Todos',
  person: 'Persona',
  attempts: 'Intentos',
  decision: 'Decisión',
  media: 'Media',
};

const dataTypeIcons: Record<DataType, any> = {
  all: Code,
  person: User,
  attempts: ListChecks,
  decision: ShieldCheck,
  media: ImageIcon,
};

const individualTypes: DataType[] = ['person', 'attempts', 'decision', 'media'];

export function VeriffApiPanel({ sessionId, veriffSessionId, organizationId }: VeriffApiPanelProps) {
  const [loading, setLoading] = useState<Record<DataType, boolean>>({
    all: false,
    person: false,
    attempts: false,
    decision: false,
    media: false,
  });
  
  const [data, setData] = useState<Record<DataType, any>>({
    all: null,
    person: null,
    attempts: null,
    decision: null,
    media: null,
  });

  const [lastQueried, setLastQueried] = useState<Record<DataType, string | null>>({
    all: null,
    person: null,
    attempts: null,
    decision: null,
    media: null,
  });

  if (!veriffSessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API de Veriff</CardTitle>
          <CardDescription>Consultar datos crudos directamente desde Veriff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Esta sesión no tiene un ID de Veriff asociado.
            <br />
            No se pueden consultar datos de la API.
          </div>
        </CardContent>
      </Card>
    );
  }

  const queryVeriff = async (dataType: DataType) => {
    setLoading(prev => ({ ...prev, [dataType]: true }));
    try {
      const response = await fetch('/api/verifications/query-veriff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veriffSessionId, dataType, organizationId }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setData(prev => ({ ...prev, [dataType]: result.data }));
      setLastQueried(prev => ({ ...prev, [dataType]: new Date().toISOString() }));
      toast.success(`Datos de ${dataTypeLabels[dataType]} obtenidos correctamente`);
    } catch (error: any) {
      console.error(`Error consultando ${dataType}:`, error);
      toast.error(error.message || `Error al consultar ${dataType}`);
    } finally {
      setLoading(prev => ({ ...prev, [dataType]: false }));
    }
  };

  const endpointLabels: Record<DataType, string> = {
    all: 'GET /v1/sessions/{id}/ (person + attempts + decision + media)',
    person: 'GET /v1/sessions/{id}/person',
    attempts: 'GET /v1/sessions/{id}/attempts',
    decision: 'GET /v1/sessions/{id}/decision',
    media: 'GET /v1/sessions/{id}/media',
  };

  // Proxy URL para cargar imágenes de Veriff con autenticación
  const getProxyUrl = (originalUrl: string) => {
    return `/api/verifications/proxy-media?url=${encodeURIComponent(originalUrl)}`;
  };

  // Renderizar imágenes de media si están disponibles
  const renderMediaPreview = (mediaData: any) => {
    if (!mediaData) return null;
    const images = mediaData.images || [];
    if (images.length === 0) return null;

    return (
      <div className="space-y-4 mb-4">
        <h4 className="text-sm font-medium">Vista previa ({images.length} archivos)</h4>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
          {images.map((img: any, idx: number) => (
            <div key={img.id || idx} className="rounded-lg border overflow-hidden">
              {img.mimeType?.startsWith('video') ? (
                <div className="bg-muted flex items-center justify-center h-32">
                  <p className="text-xs text-muted-foreground">🎥 Video</p>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={getProxyUrl(img.url)} 
                  alt={img.context || `Imagen ${idx + 1}`} 
                  className="w-full h-32 object-cover bg-muted"
                  loading="lazy"
                />
              )}
              <div className="p-2 bg-muted/50">
                <p className="text-xs font-medium capitalize">{(img.context || 'desconocido').replace('-', ' ')}</p>
                <p className="text-[10px] text-muted-foreground">{img.mimeType}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>API de Veriff - Datos Crudos</CardTitle>
            <CardDescription>
              Consulta directa a la API de Veriff sin guardar datos localmente
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-2">
              Veriff Session ID: <code className="bg-muted px-1 py-0.5 rounded">{veriffSessionId}</code>
            </p>
          </div>
          <Button onClick={() => queryVeriff('all')} variant="outline" size="sm" disabled={loading.all}>
            {loading.all ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Consultando...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" />Consultar Todo</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {(['all', ...individualTypes] as DataType[]).map((type) => {
              const Icon = dataTypeIcons[type];
              return (
                <TabsTrigger key={type} value={type}>
                  <Icon className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">{dataTypeLabels[type]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(['all', ...individualTypes] as DataType[]).map((type) => (
            <TabsContent key={type} value={type}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{endpointLabels[type]}</h3>
                    {lastQueried[type] && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Última consulta: {new Date(lastQueried[type]!).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => queryVeriff(type)}
                    disabled={loading[type]}
                    size="sm"
                  >
                    {loading[type] ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Consultando...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" />Consultar {dataTypeLabels[type]}</>
                    )}
                  </Button>
                </div>

                {/* Vista previa de imágenes para media */}
                {type === 'media' && renderMediaPreview(data[type])}
                {type === 'all' && data[type]?.media && renderMediaPreview(data[type].media)}

                {data[type] ? (
                  <div className="rounded-md bg-muted p-4 overflow-auto max-h-[500px]">
                    <pre className="text-xs">
                      {JSON.stringify(data[type], null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                    Haz clic en el botón para consultar {type === 'all' ? 'todos los datos' : `los datos de ${dataTypeLabels[type].toLowerCase()}`} desde Veriff
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Esta consulta obtiene datos directamente de la API de Veriff sin guardarlos en la base de datos local. 
            Usa el botón "Refrescar desde Veriff" en Acciones si quieres actualizar los datos guardados y descargar las fotos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
