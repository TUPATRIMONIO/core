import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BlogPostForm } from '@/components/admin/blog-post-form'
import { redirect, notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getPost(id: string) {
  const supabase = createServiceRoleClient()

  const { data: post, error } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) {
    return null
  }

  return post
}

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

async function updateBlogPost(postId: string, formData: FormData) {
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

  // Obtener el post actual para mantener published_at si ya estaba publicado
  const { data: currentPost } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .select('published, published_at')
    .eq('id', postId)
    .single()

  const updateData: any = {
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
    updated_at: new Date().toISOString(),
  }

  // Si se está publicando por primera vez, establecer published_at
  if (published && !currentPost?.published_at) {
    updateData.published_at = new Date().toISOString()
  }
  // Si se despublica, mantener published_at pero el post no estará publicado
  // Si se vuelve a publicar después de despublicar, mantener el published_at original

  const { error } = await supabase
    .schema('marketing')
    .from('blog_posts')
    .update(updateData)
    .eq('id', postId)

  if (error) {
    console.error('Error updating blog post:', error)
    throw new Error('Error al actualizar el post')
  }

  redirect('/admin/blog')
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params
  const post = await getPost(id)
  const categories = await getCategories()

  if (!post) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Editar Post"
        description={`Editando: ${post.title}`}
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
              Modifica los campos del artículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BlogPostForm
              categories={categories}
              action={(formData) => updateBlogPost(id, formData)}
              initialData={{
                title: post.title,
                slug: post.slug,
                content: post.content,
                excerpt: post.excerpt || undefined,
                featured_image_url: post.featured_image_url || undefined,
                category_id: post.category_id || undefined,
                author_name: post.author_name,
                seo_title: post.seo_title || undefined,
                seo_description: post.seo_description || undefined,
                reading_time: post.reading_time || 5,
                published: post.published,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
