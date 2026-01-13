import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogCategoryForm } from '@/components/admin/blog-category-form'
import { redirect } from 'next/navigation'

async function createCategory(formData: FormData) {
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
    .insert({
      name,
      slug,
      description: description || null,
      color: color || '#800039',
      sort_order: sortOrder,
      is_active: isActive,
    })

  if (error) {
    console.error('Error creating category:', error)
    throw new Error('Error al crear la categoría')
  }

  redirect('/admin/blog/categories')
}

export default async function NewCategoryPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Nueva Categoría"
        description="Crea una nueva categoría para el blog"
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
              Completa los campos para crear una nueva categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogCategoryForm action={createCategory} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
