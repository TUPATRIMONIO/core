/**
 * Lista de Posts del Blog
 * Tabla con filtros, búsqueda y acciones CRUD
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBlogManagement, type BlogPost, type BlogFilters } from '@/hooks/useBlogManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Filter,
  FileText,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export function BlogPostsList() {
  const router = useRouter();
  const {
    posts,
    categories,
    isLoading,
    error,
    fetchPosts,
    fetchCategories,
    deletePost,
    isAdmin
  } = useBlogManagement();

  const [filters, setFilters] = useState<BlogFilters>({
    published: undefined,
    category_id: '',
    search: ''
  });

  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 20;

  useEffect(() => {
    if (isAdmin) {
      fetchCategories();
      fetchPosts(filters);
    }
  }, [isAdmin]);

  useEffect(() => {
    // Debounce para búsqueda
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts(filters);
      setCurrentPage(1);
    }
  }, [filters]);

  const handleDeletePost = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar el post "${title}"?`)) return;

    const result = await deletePost(id);

    if (result.success) {
      await fetchPosts(filters);
    }
  };

  const handleFilterChange = (key: keyof BlogFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Sin categoría';
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#6b7280';
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.color || '#6b7280';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Paginación
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para ver los posts del blog
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts del Blog</h1>
          <p className="text-sm text-gray-600 mt-1">
            {posts.length} post{posts.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/blog/new')}
          className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Post
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título o contenido..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Estado */}
            <div>
              <Select
                value={
                  filters.published === undefined
                    ? 'all'
                    : filters.published
                    ? 'published'
                    : 'draft'
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    'published',
                    value === 'all' ? undefined : value === 'published'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Categoría */}
            <div>
              <Select
                value={filters.category_id || 'all'}
                onValueChange={(value) => handleFilterChange('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
        </div>
      ) : currentPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay posts
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {posts.length === 0
                ? 'Crea tu primer post para comenzar'
                : 'No hay posts que coincidan con los filtros'}
            </p>
            {posts.length === 0 && (
              <Button
                onClick={() => router.push('/dashboard/blog/new')}
                className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Post
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: Tabla */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Título
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vistas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {post.featured_image_url && (
                                <img
                                  src={post.featured_image_url}
                                  alt=""
                                  className="w-12 h-12 rounded object-cover mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {post.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {post.author_name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getCategoryColor(post.category_id) }}
                              />
                              <span className="text-sm text-gray-900">
                                {getCategoryName(post.category_id)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={post.published ? 'default' : 'secondary'}>
                              {post.published ? 'Publicado' : 'Borrador'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {post.view_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(post.published_at || post.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {post.published && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    window.open(`https://tupatrimonio.app/blog/${post.slug}`, '_blank')
                                  }
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePost(post.id, post.title)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-4">
            {currentPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{post.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{post.author_name}</p>
                    </div>
                    <Badge variant={post.published ? 'default' : 'secondary'}>
                      {post.published ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </div>

                  {post.featured_image_url && (
                    <img
                      src={post.featured_image_url}
                      alt=""
                      className="w-full h-32 rounded object-cover"
                    />
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(post.category_id) }}
                      />
                      {getCategoryName(post.category_id)}
                    </div>
                    <span>·</span>
                    <span>{post.view_count} vistas</span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    {post.published && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.open(`https://tupatrimonio.app/blog/${post.slug}`, '_blank')
                        }
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePost(post.id, post.title)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={
                      currentPage === page
                        ? 'bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]'
                        : ''
                    }
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

