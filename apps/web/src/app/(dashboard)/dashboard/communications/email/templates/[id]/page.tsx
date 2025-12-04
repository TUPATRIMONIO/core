'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { previewTemplate } from '@/lib/communications/template-engine';
import Link from 'next/link';

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [preview, setPreview] = useState({ subject: '', html: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const response = await fetch(`/api/communications/templates/${templateId}?preview=true`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setTemplate(data.data);
        if (data.preview) {
          setPreview(data.preview);
        }
      }
    } catch (err: any) {
      setError('Error al cargar template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/communications/templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        router.push('/dashboard/communications/email/templates');
      }
    } catch (err: any) {
      setError('Error al eliminar template');
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

  if (error || !template) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Template no encontrado'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{template.name}</h1>
          <p className="text-muted-foreground mt-2">{template.description || 'Sin descripción'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Ocultar Preview' : 'Ver Preview'}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/communications/email/templates/${templateId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{template.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Versión</p>
              <p className="font-medium">{template.version}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usos</p>
              <p className="font-medium">{template.usage_count || 0}</p>
            </div>
            {template.variables && Object.keys(template.variables).length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Variables Disponibles</p>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(template.variables).map((key) => (
                    <Badge key={key} variant="outline" className="text-xs">
                      {`{{${key}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asunto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{template.subject}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cuerpo del Email</CardTitle>
          <CardDescription>
            {previewMode ? 'Vista previa con datos de ejemplo' : 'Código HTML del template'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewMode ? (
            <div className="border rounded-md p-4 bg-white">
              <div className="mb-4 text-sm font-semibold">Preview:</div>
              <div className="mb-4 text-xs text-muted-foreground border-b pb-2">
                <strong>Asunto:</strong> {preview.subject}
              </div>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </div>
          ) : (
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
              {template.body_html}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





