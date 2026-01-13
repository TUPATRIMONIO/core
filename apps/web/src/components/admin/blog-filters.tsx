'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface BlogFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>
}

export function BlogFilters({ categories }: BlogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const buildUrl = useCallback((newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    const queryString = params.toString()
    return `/admin/blog${queryString ? `?${queryString}` : ''}`
  }, [searchParams])

  const handleStatusChange = (status: string) => {
    router.push(buildUrl({ status: status || undefined, page: undefined }))
  }

  const handleCategoryChange = (category: string) => {
    router.push(buildUrl({ category: category || undefined, page: undefined }))
  }

  const hasFilters = searchParams.get('category') || searchParams.get('status')

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Estado:</label>
            <select
              value={searchParams.get('status') || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Categoría:</label>
              <select
                value={searchParams.get('category') || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="">Todas</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/blog')}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
