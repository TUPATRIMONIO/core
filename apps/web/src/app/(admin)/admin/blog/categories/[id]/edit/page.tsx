import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogCategoryForm } from '@/components/admin/blog-category-form'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getCategory(id: string) {
  const supabase = createServiceRoleClient()

  const { data: category, error } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !category) {
    return null
  }

  return category
}

async function updateCategory(categoryId: string, formData: FormData) {
  'use server'

  const supabase = createServiceRoleClient()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const color = formData.get('color') as string
  const sortOrder = parseInt(formData.get('sort_order') as string) || 0
  const isActive = formData.get('is_active') === 'on'

  const { error } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .update({
      name,
      slug,
      description: description || null,
      color: color || '#800039',
      sort_order: sortOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)

  if (error) {
    console.error('Error updating category:', error)
    throw new Error('Error al actualizar la categoría')
  }

  redirect('/admin/blog/categories')
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params
  const category = await getCategory(id)

  if (!category) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Editar Categoría"
        description={`Editando: ${category.name}`}
        actions={
          <Link href="/admin/blog/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="flex-1 px-4 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la Categoría</CardTitle>
            <CardDescription>
              Modifica los campos de la categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogCategoryForm
              action={(formData) => updateCategory(id, formData)}
              initialData={{
                name: category.name,
                slug: category.slug,
                description: category.description || undefined,
                color: category.color,
                sort_order: category.sort_order,
                is_active: category.is_active,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
