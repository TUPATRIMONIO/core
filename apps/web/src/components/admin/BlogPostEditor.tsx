/**
 * Editor de Posts para Blog
 * Editor Markdown con preview en vivo y gestión completa de contenido
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useBlogManagement,
  generateSlug,
  calculateReadingTime,
  type BlogPost
} from '@/hooks/useBlogManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Save,
  Eye,
  Code,
  ArrowLeft,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { MediaGallery } from './MediaGallery';

interface BlogPostEditorProps {
  postId?: string;
  mode?: 'create' | 'edit';
}

export function BlogPostEditor({ postId, mode = 'create' }: BlogPostEditorProps) {
  const router = useRouter();
  const {
    categories,
    isLoading,
    getPost,
    createPost,
    updatePost,
    fetchCategories,
    isAdmin
  } = useBlogManagement();

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    category_id: undefined,
    author_name: 'TuPatrimonio Team',
    published: false,
    seo_title: '',
    seo_description: '',
    reading_time: 5
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState<'editor' | 'preview'>('editor');
  const [showMediaGallery, setShowMediaGallery] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
    }

    if (mode === 'edit' && postId) {
      loadPost();
    }
  }, [isAdmin, postId, mode]);

  // Calcular tiempo de lectura dinámicamente
  const currentReadingTime = formData.content 
    ? calculateReadingTime(formData.content) 
    : 1;

  const loadPost = async () => {
    if (!postId) return;

    setIsLoadingPost(true);
    const post = await getPost(postId);

    if (post) {
      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || '',
        featured_image_url: post.featured_image_url || '',
        category_id: post.category_id || '',
        author_name: post.author_name,
        published: post.published,
        seo_title: post.seo_title || '',
        seo_description: post.seo_description || '',
        reading_time: post.reading_time || 5
      });
    } else {
      setError('No se pudo cargar el post');
    }

    setIsLoadingPost(false);
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: mode === 'create' ? generateSlug(title) : formData.slug
    });
  };

  const handleSave = async () => {
    // Validaciones
    if (!formData.title?.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!formData.slug?.trim()) {
      setError('El slug es requerido');
      return;
    }

    if (!formData.content?.trim()) {
      setError('El contenido es requerido');
      return;
    }

    if (formData.content.length < 100) {
      setError('El contenido debe tener al menos 100 caracteres');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Calcular tiempo de lectura antes de guardar
      const readingTime = calculateReadingTime(formData.content);
      const postData = {
        ...formData,
        reading_time: readingTime
      };

      let result;

      if (mode === 'edit' && postId) {
        result = await updatePost(postId, postData);
      } else {
        result = await createPost(postData);
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/blog');
        }, 1500);
      } else {
        setError(result.error || 'Error al guardar el post');
      }
    } catch (err) {
      setError('Error inesperado al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (url: string) => {
    setFormData({ ...formData, featured_image_url: url });
    setShowMediaGallery(false);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para editar posts
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoadingPost) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
      </div>
    );
  }

  const charCount = formData.content?.length || 0;
  const excerptCount = formData.excerpt?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/blog')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Editar Post' : 'Nuevo Post'}
            </h1>
            {formData.published && (
              <Badge className="mt-1">Publicado</Badge>
            )}
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Post
            </>
          )}
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            ¡Post guardado exitosamente! Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {/* Formulario Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Título del post"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500">
                  {formData.title?.length || 0}/200 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-del-post"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Extracto</Label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Breve descripción del post (máx 500 caracteres)"
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--tp-buttons)] resize-none"
                />
                <p className="text-xs text-gray-500">
                  {excerptCount}/500 caracteres
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Editor de Contenido */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contenido</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={previewMode === 'editor' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('editor')}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Editor
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'preview' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('preview')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
              <CardDescription>
                Usa Markdown para formatear el contenido. Mínimo 100 caracteres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewMode === 'editor' ? (
                <div className="space-y-2">
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="# Escribe tu contenido en Markdown&#10;&#10;## Ejemplo de subtítulo&#10;&#10;- Lista 1&#10;- Lista 2&#10;&#10;**Texto en negrita**"
                    rows={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--tp-buttons)] font-mono text-sm resize-y"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{charCount} caracteres</span>
                    <span>{currentReadingTime} min de lectura</span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none min-h-[500px] p-4 border border-gray-200 rounded-md">
                  {formData.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">
                      El preview aparecerá aquí...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Optimización SEO</CardTitle>
              <CardDescription>
                Mejora la visibilidad en buscadores (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="Título optimizado para SEO (máx 60 caracteres)"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_title?.length || 0}/60 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description">Descripción SEO</Label>
                <textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="Descripción para resultados de búsqueda (máx 160 caracteres)"
                  maxLength={160}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--tp-buttons)] resize-none"
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_description?.length || 0}/160 caracteres
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Publicación */}
          <Card>
            <CardHeader>
              <CardTitle>Publicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Estado</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={formData.published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, published: checked })
                    }
                  />
                  <span className="text-sm">
                    {formData.published ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_name">Autor</Label>
                <Input
                  id="author_name"
                  value={formData.author_name}
                  onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Nombre del autor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría (opcional)</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((cat) => cat.is_active)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Imagen Destacada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagen Destacada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featured_image_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={formData.featured_image_url}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="featured_image_url">URL de Imagen</Label>
                <Input
                  id="featured_image_url"
                  value={formData.featured_image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <Dialog open={showMediaGallery} onOpenChange={setShowMediaGallery}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Seleccionar desde Galería
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Imagen</DialogTitle>
                  </DialogHeader>
                  <MediaGallery
                    onSelect={handleImageSelect}
                    bucket="blog-featured"
                    mode="selector"
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Caracteres:</span>
                <span className="font-medium">{charCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo de lectura:</span>
                <span className="font-medium">{currentReadingTime} min</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

