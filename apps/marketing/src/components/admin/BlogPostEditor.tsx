'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ImageUploader from './ImageUploader'
import MarkdownEditor from './MarkdownEditor'

interface BlogPostEditorProps {
  post?: any
  mode: 'create' | 'edit'
}

export default function BlogPostEditor({ post, mode }: BlogPostEditorProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    featured_image_url: post?.featured_image_url || '',
    category_id: post?.category_id || '',
    author_name: post?.author_name || 'Equipo TuPatrimonio',
    published: post?.published || false,
    seo_title: post?.seo_title || '',
    seo_description: post?.seo_description || '',
    reading_time: post?.reading_time || 5,
  })

  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  // Auto-generar slug desde título
  useEffect(() => {
    if (mode === 'create' && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, mode])

  async function loadCategories() {
    const { data } = await supabase
      .schema('marketing')
      .from('blog_categories')
      .select('*')
      .order('name')
    setCategories(data || [])
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    // Validaciones del frontend
    if (formData.title.length < 3) {
      setError('El título debe tener al menos 3 caracteres')
      setSaving(false)
      return
    }

    if (formData.content.length < 10) {
      setError('El contenido debe tener al menos 10 caracteres')
      setSaving(false)
      return
    }

    if (!formData.slug || formData.slug.length < 3) {
      setError('El slug debe tener al menos 3 caracteres')
      setSaving(false)
      return
    }

    try {
      // Preparar datos: convertir strings vacíos a null para campos UUID
      const dataToSave = {
        ...formData,
        category_id: formData.category_id || null,
        published_at: formData.published ? new Date().toISOString() : null
      }

      if (mode === 'create') {
        const { error } = await supabase
          .schema('marketing')
          .from('blog_posts')
          .insert([dataToSave])

        if (error) throw error
        router.push('/admin/blog')
        router.refresh()
      } else {
        const { error } = await supabase
          .schema('marketing')
          .from('blog_posts')
          .update({
            ...dataToSave,
            published_at: formData.published ? (post.published_at || new Date().toISOString()) : null
          })
          .eq('id', post.id)

        if (error) throw error
        router.push('/admin/blog')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de eliminar este post?')) return

    const { error } = await supabase
      .schema('marketing')
      .from('blog_posts')
      .delete()
      .eq('id', post.id)

    if (!error) {
      router.push('/admin/blog')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="col-span-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Título del post"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="url-del-post"
            />
            <p className="text-sm text-gray-500">
              URL: /blog/{formData.slug}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Contenido</Label>
            <MarkdownEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Extracto</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Breve descripción del post"
              rows={3}
            />
          </div>

          {/* SEO Section */}
          <div className="border-t pt-6">
            <h3 className="font-bold mb-4">SEO</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">Título SEO</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="Título optimizado para SEO (60 chars)"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_title.length}/60 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">Descripción SEO</Label>
                <Textarea
                  id="seo_description"
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="Descripción para motores de búsqueda (160 chars)"
                  maxLength={160}
                  rows={2}
                />
                <p className="text-xs text-gray-500">
                  {formData.seo_description.length}/160 caracteres
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="published">Publicado</Label>
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input
                id="author"
                value={formData.author_name}
                onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading_time">Tiempo de lectura (min)</Label>
              <Input
                id="reading_time"
                type="number"
                value={formData.reading_time}
                onChange={(e) => setFormData({ ...formData, reading_time: parseInt(e.target.value) || 5 })}
                min="1"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <Label>Imagen Destacada</Label>
            <ImageUploader
              value={formData.featured_image_url}
              onChange={(url) => setFormData({ ...formData, featured_image_url: url })}
              bucket="marketing-images"
              path="blog/featured"
            />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleSave}
              className="w-full bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              disabled={saving}
            >
              {saving ? 'Guardando...' : (mode === 'create' ? 'Crear Post' : 'Guardar Cambios')}
            </Button>

            {mode === 'edit' && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="w-full"
              >
                Eliminar Post
              </Button>
            )}

            <Button
              onClick={() => router.push('/admin/blog')}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

