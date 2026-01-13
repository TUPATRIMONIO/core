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
import { Tag, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Badge } from '@/components/ui/badge'
import { BlogCategoryActions } from '@/components/admin/blog-category-actions'

interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  sort_order: number
  is_active: boolean
  created_at: string
}

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

const ITEMS_PER_PAGE = 20

async function getCategories(params: {
  page: number
}): Promise<{ categories: BlogCategory[], total: number }> {
  const supabase = createServiceRoleClient()

  const offset = (params.page - 1) * ITEMS_PER_PAGE

  const { data: categories, error, count } = await supabase
    .schema('marketing')
    .from('blog_categories')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], total: 0 }
  }

  return {
    categories: (categories || []) as BlogCategory[],
    total: count || 0,
  }
}

export default async function BlogCategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const { categories, total } = await getCategories({ page })

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Build URL with current filters
  const buildUrl = (newParams: Record<string, string | undefined>) => {
    const urlParams = new URLSearchParams()
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        urlParams.set(key, value)
      } else {
        urlParams.delete(key)
      }
    })

    const queryString = urlParams.toString()
    return `/admin/blog/categories${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Categorías del Blog"
        description="Administra las categorías de los artículos"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/admin/blog">
              <Button variant="outline" size="sm">
                Posts
              </Button>
            </Link>
            <Link href="/admin/blog/categories/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 px-4 pb-6 space-y-4">
        {/* Categories Table */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={Tag}
                title="No hay categorías"
                description="Aún no se han creado categorías para el blog"
                action={{
                  label: 'Crear primera categoría',
                  onClick: () => {
                    window.location.href = '/admin/blog/categories/new'
                  }
                }}
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
                      <TableHead className="min-w-[150px]">Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Orden</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {category.color}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{category.sort_order}</TableCell>
                        <TableCell>
                          {category.is_active ? (
                            <Badge className="bg-green-500">Activa</Badge>
                          ) : (
                            <Badge variant="secondary">Inactiva</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <BlogCategoryActions categoryId={category.id} />
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
                    Mostrando {(page - 1) * ITEMS_PER_PAGE + 1} a {Math.min(page * ITEMS_PER_PAGE, total)} de {total} categorías
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
