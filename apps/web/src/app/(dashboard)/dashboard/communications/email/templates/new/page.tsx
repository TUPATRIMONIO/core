'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye } from 'lucide-react';
import { previewTemplate } from '@/lib/communications/template-engine';

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    subject: '',
    body_html: '',
    body_text: '',
  });

  const [preview, setPreview] = useState({ subject: '', html: '' });

  const handlePreview = () => {
    try {
      const previewSubject = previewTemplate(formData.subject);
      const previewHtml = previewTemplate(formData.body_html);
      setPreview({ subject: previewSubject, html: previewHtml });
      setPreviewMode(true);
    } catch (err: any) {
      setError(`Error en preview: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/communications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        router.push('/dashboard/communications/email/templates');
      }
    } catch (err: any) {
      setError('Error al crear template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Template</h1>
        <p className="text-muted-foreground mt-2">
          Crea un template reutilizable para tus campañas de email
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Ej: Newsletter Mensual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del template..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido del Email</CardTitle>
            <CardDescription>
              Usa variables como {`{{contact.name}}`}, {`{{contact.email}}`}, {`{{organization.name}}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="Ej: Hola {{contact.name}}, te tenemos una oferta especial"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="body_html">Cuerpo HTML *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
              {previewMode ? (
                <div className="border rounded-md p-4 bg-white">
                  <div className="mb-2 text-sm font-semibold">Preview:</div>
                  <div className="mb-2 text-xs text-muted-foreground">
                    Asunto: {preview.subject}
                  </div>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: preview.html }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setPreviewMode(false)}
                  >
                    Editar
                  </Button>
                </div>
              ) : (
                <Textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  required
                  placeholder="<h1>Hola {{contact.name}}</h1><p>Contenido del email...</p>"
                  rows={12}
                  className="font-mono text-sm"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="body_text">Cuerpo Texto Plano (Opcional)</Label>
              <Textarea
                id="body_text"
                value={formData.body_text}
                onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                placeholder="Versión texto plano del email..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Template'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}





