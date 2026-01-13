import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Plus, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { BlogPostActions } from '@/components/admin/blog-post-actions'
import { BlogFilters } from '@/components/admin/blog-filters'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  published_at: string | null
  author_name: string
  view_count: number
  created_at: string
  blog_categories: {
    name: string
    slug: string
    color: string
  } | null
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    category?: string
    status?: string
  }>
}

const ITEMS_PER_PAGE = 20

async function getBlogPosts(params: {
  page: number
  category?: string
  status?: string
}): Promise<{ posts: BlogPost[], total: number }> {
  const supabase = createServiceRoleClient()

  const offset = (params.page - 1) * ITEMS_PER_PAGE

  try {
    // Consultar al schema marketing
    let query = supabase
      .schema('marketing')
      .from('blog_posts')
      .select('*', { count: 'exact' })

    // Apply filters
    if (params.category) {
      query = query.eq('category_id', params.category)
    }

    if (params.status === 'published') {
      query = query.eq('published', true)
    } else if (params.status === 'draft') {
      query = query.eq('published', false)
    }

    // Order and paginate
    const { data: postsData, error: postsError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    if (postsError) {
      console.error('Error fetching blog posts:', postsError)
      return { posts: [], total: 0 }
    }

    if (!postsData || postsData.length === 0) {
      return { posts: [], total: count || 0 }
    }

    // Obtener las categorías para los posts que tienen category_id
    const categoryIds = [...new Set(postsData.map(p => p.category_id).filter(Boolean))]
    let categoriesMap: Record<string, any> = {}

    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .schema('marketing')
        .from('blog_categories')
        .select('id, name, slug, color')
        .in('id', categoryIds)

      if (categories) {
        categoriesMap = categories.reduce((acc, cat) => {
          acc[cat.id] = cat
          return acc
        }, {} as Record<string, any>)
      }
    }

    // Combinar posts con sus categorías
    const posts = postsData.map((post: any) => ({
      ...post,
      blog_categories: post.category_id && categoriesMap[post.category_id]
        ? categoriesMap[post.category_id]
        : null,
    }))

    return {
      posts: posts as BlogPost[],
      total: count || 0,
    }
  } catch (error: any) {
    console.error('Error in getBlogPosts:', error)
    console.error('Error stack:', error?.stack)
    return { posts: [], total: 0 }
  }
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

export default async function AdminBlogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const { posts, total } = await getBlogPosts({
    page,
    category: params.category,
    status: params.status,
  })

  const categories = await getCategories()
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const hasFilters = params.category || params.status

  // Build URL with current filters
  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    if (params.category) urlParams.set('category', params.category)
    if (params.status) urlParams.set('status', params.status)
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value)
      } else {
        urlParams.delete(key)
      }
    })

    const queryString = urlParams.toString()
    return `/admin/blog${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Blog"
        description="Administra los artículos del blog"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/blog/categories">
              <Button variant="outline" size="sm">
                Categorías
              </Button>
            </Link>
            <Link href="/admin/blog/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Post
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Filters */}
        <BlogFilters categories={categories} />

        {/* Posts Table */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={BookOpen}
                title="No hay posts"
                description={hasFilters ? "No se encontraron posts con los filtros seleccionados" : "Aún no se han creado posts en el blog"}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Título</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Autor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Vistas</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{post.title}</span>
                            {post.excerpt && (
                              <span className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                {post.excerpt}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.blog_categories ? (
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: post.blog_categories.color,
                                color: post.blog_categories.color,
                              }}
                            >
                              {post.blog_categories.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin categoría</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{post.author_name}</TableCell>
                        <TableCell>
                          {post.published ? (
                            <Badge className="bg-green-500">
                              <Eye className="h-3 w-3 mr-1" />
                              Publicado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Borrador
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{post.view_count || 0}</TableCell>
                        <TableCell className="text-sm">
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : new Date(post.created_at).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                        </TableCell>
                        <TableCell className="text-right">
                          <BlogPostActions postId={post.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a {Math.min(page * ITEMS_PER_PAGE, total)} de {total} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={buildUrl({ page: page > 1 ? String(page - 1) : undefined })}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="outline" size="sm" disabled={page === 1}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>
                    <Link
                      href={buildUrl({ page: page < totalPages ? String(page + 1) : undefined })}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    >
                      <Button variant="outline" size="sm" disabled={page === totalPages}>
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
