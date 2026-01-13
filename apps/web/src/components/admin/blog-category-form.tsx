'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'

interface BlogCategoryFormProps {
  action: (formData: FormData) => Promise<void>
  initialData?: {
    name?: string
    slug?: string
    description?: string
    color?: string
    sort_order?: number
    is_active?: boolean
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

export function BlogCategoryForm({ action, initialData }: BlogCategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(!initialData?.slug)

  useEffect(() => {
    if (autoGenerateSlug && name) {
      setSlug(slugify(name))
    }
  }, [name, autoGenerateSlug])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(e.currentTarget)
      await action(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Error al guardar la categoría. Por favor, intenta nuevamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          placeholder="Nombre de la categoría"
        />
        <p className="text-xs text-muted-foreground">
          Mínimo 2 caracteres, máximo 100 caracteres
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
          maxLength={50}
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          placeholder="nombre-categoria"
        />
        <p className="text-xs text-muted-foreground">
          Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
        </p>
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description || ''}
          rows={3}
          placeholder="Descripción de la categoría (opcional)"
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <div className="flex items-center gap-4">
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={initialData?.color || '#800039'}
            className="w-20 h-10"
            onChange={(e) => {
              const textInput = document.getElementById('color-text') as HTMLInputElement
              if (textInput) {
                textInput.value = e.target.value
              }
            }}
          />
          <Input
            id="color-text"
            name="color"
            type="text"
            defaultValue={initialData?.color || '#800039'}
            pattern="^#[0-9A-Fa-f]{6}$"
            placeholder="#800039"
            onChange={(e) => {
              const colorInput = document.getElementById('color') as HTMLInputElement
              if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                colorInput.value = e.target.value
              }
            }}
            className="max-w-[120px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Color que se usará para identificar la categoría. Formato hexadecimal (#RRGGBB)
        </p>
      </div>

      {/* Orden */}
      <div className="space-y-2">
        <Label htmlFor="sort_order">Orden</Label>
        <Input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={initialData?.sort_order || 0}
          min="0"
        />
        <p className="text-xs text-muted-foreground">
          Número que determina el orden de visualización. Menor número = aparece primero.
        </p>
      </div>

      {/* Activa */}
      <div className="flex items-center space-x-2 border-t pt-4">
        <Checkbox
          id="is_active"
          name="is_active"
          defaultChecked={initialData?.is_active !== false}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Categoría activa
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
