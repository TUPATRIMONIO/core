'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  slug: string
}

interface BlogPostFormProps {
  categories: Category[]
  action: (formData: FormData) => Promise<void>
  initialData?: {
    title?: string
    slug?: string
    content?: string
    excerpt?: string
    featured_image_url?: string
    category_id?: string
    author_name?: string
    seo_title?: string
    seo_description?: string
    reading_time?: number
    published?: boolean
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function BlogPostForm({ categories, action, initialData }: BlogPostFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState(initialData?.title || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(!initialData?.slug)

  useEffect(() => {
    if (autoGenerateSlug && title) {
      setSlug(slugify(title))
    }
  }, [title, autoGenerateSlug])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar el post. Por favor, intenta nuevamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
          maxLength={200}
          placeholder="Título del artículo"
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 5 caracteres, máximo 200 caracteres
        </p>
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-slug"
              checked={autoGenerateSlug}
              onCheckedChange={(checked) => setAutoGenerateSlug(checked === true)}
            />
            <Label htmlFor="auto-slug" className="text-sm font-normal cursor-pointer">
              Generar automáticamente
            </Label>
          </div>
        </div>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setAutoGenerateSlug(false)
          }}
          required
          minLength={3}
          maxLength={200}
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          placeholder="url-del-articulo"
        />
        <p className="text-xs text-muted-foreground">
          Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
        </p>
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <Label htmlFor="category_id">Categoría</Label>
        <Select name="category_id" defaultValue={initialData?.category_id || ''}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Sin categoría</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contenido */}
      <div className="space-y-2">
        <Label htmlFor="content">
          Contenido <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={initialData?.content || ''}
          required
          minLength={100}
          rows={20}
          className="font-mono text-sm"
          placeholder="Escribe el contenido del artículo aquí..."
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 100 caracteres. Puedes usar Markdown.
        </p>
      </div>

      {/* Extracto */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Extracto</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          defaultValue={initialData?.excerpt || ''}
          maxLength={500}
          rows={3}
          placeholder="Breve descripción del artículo (opcional)"
        />
        <p className="text-xs text-muted-foreground">
          Máximo 500 caracteres. Se mostrará en la lista de artículos.
        </p>
      </div>

      {/* Imagen destacada */}
      <div className="space-y-2">
        <Label htmlFor="featured_image_url">URL de imagen destacada</Label>
        <Input
          id="featured_image_url"
          name="featured_image_url"
          type="url"
          defaultValue={initialData?.featured_image_url || ''}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
        <p className="text-xs text-muted-foreground">
          URL completa de la imagen que se mostrará como destacada
        </p>
      </div>

      {/* Autor */}
      <div className="space-y-2">
        <Label htmlFor="author_name">Nombre del autor</Label>
        <Input
          id="author_name"
          name="author_name"
          defaultValue={initialData?.author_name || 'TuPatrimonio Team'}
          placeholder="TuPatrimonio Team"
        />
      </div>

      {/* Tiempo de lectura */}
      <div className="space-y-2">
        <Label htmlFor="reading_time">Tiempo de lectura (minutos)</Label>
        <Input
          id="reading_time"
          name="reading_time"
          type="number"
          min="1"
          defaultValue={initialData?.reading_time || 5}
        />
      </div>

      {/* SEO */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">SEO</h3>

        <div className="space-y-2">
          <Label htmlFor="seo_title">Título SEO</Label>
          <Input
            id="seo_title"
            name="seo_title"
            defaultValue={initialData?.seo_title || ''}
            maxLength={60}
            placeholder="Título optimizado para buscadores"
          />
          <p className="text-xs text-muted-foreground">
            Máximo 60 caracteres. Si no se especifica, se usará el título del artículo.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_description">Descripción SEO</Label>
          <Textarea
            id="seo_description"
            name="seo_description"
            defaultValue={initialData?.seo_description || ''}
            maxLength={160}
            rows={2}
            placeholder="Descripción optimizada para buscadores"
          />
          <p className="text-xs text-muted-foreground">
            Máximo 160 caracteres. Se mostrará en los resultados de búsqueda.
          </p>
        </div>
      </div>

      {/* Publicar */}
      <div className="flex items-center space-x-2 border-t pt-4">
        <Checkbox
          id="published"
          name="published"
          defaultChecked={initialData?.published || false}
        />
        <Label htmlFor="published" className="cursor-pointer">
          Publicar inmediatamente
        </Label>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
