import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogPostForm } from '@/components/admin/blog-post-form'
import { redirect } from 'next/navigation'

async function getCategories() {
  const supabase = createServiceRoleClient()

  const { data: categories, error } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return categories || []
}

async function createBlogPost(formData: FormData) {
  'use server'

  const supabase = createServiceRoleClient()

  const title = formData.get('title') as string
  const slug = formData.get('slug') as string
  const content = formData.get('content') as string
  const excerpt = formData.get('excerpt') as string
  const featuredImageUrl = formData.get('featured_image_url') as string
  const categoryId = formData.get('category_id') as string
  const authorName = formData.get('author_name') as string
  const seoTitle = formData.get('seo_title') as string
  const seoDescription = formData.get('seo_description') as string
  const readingTime = parseInt(formData.get('reading_time') as string) || 5
  const published = formData.get('published') === 'on'

  const { data, error } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .insert({
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featured_image_url: featuredImageUrl || null,
      category_id: categoryId || null,
      author_name: authorName || 'TuPatrimonio Team',
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      reading_time: readingTime,
      published,
      published_at: published ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating blog post:', error)
    throw new Error('Error al crear el post')
  }

  redirect(`/admin/blog/${data.id}/edit`)
}

export default async function NewBlogPostPage() {
  const categories = await getCategories()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Nuevo Post"
        description="Crea un nuevo artículo para el blog"
        actions={
          <Link href="/admin/blog">
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
            <CardTitle>Información del Post</CardTitle>
            <CardDescription>
              Completa los campos para crear un nuevo artículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogPostForm categories={categories} action={createBlogPost} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
