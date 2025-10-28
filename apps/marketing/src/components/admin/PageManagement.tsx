/**
 * Dashboard de Administración de Páginas
 * 
 * Interfaz para gestionar estados de publicación, SEO y permisos de páginas
 * Integrada con el sistema de blog existente
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePageManagement, useIsAdmin } from '@/hooks/usePageAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Search, 
  Globe, 
  Lock, 
  FileText, 
  Settings,
  BarChart3,
  Filter,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { pageManager, type PageConfig, type PageStatus } from '@/lib/page-management';

interface PageManagementDashboardProps {
  initialPages?: PageConfig[];
}

export function PageManagementDashboard({ initialPages = [] }: PageManagementDashboardProps) {
  const { isAdmin, isLoading: isLoadingAuth } = useIsAdmin();
  const { 
    pages, 
    stats, 
    isLoading, 
    fetchPages, 
    fetchStats, 
    updatePageStatus, 
    toggleSeoIndex 
  } = usePageManagement();

  const [filter, setFilter] = useState<{
    status?: PageStatus;
    country?: string;
    section?: string;
    search?: string;
  }>({});

  const [editingPage, setEditingPage] = useState<PageConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPages(filter);
      fetchStats();
    }
  }, [isAdmin, filter]);

  // Loading state
  if (isLoadingAuth || (isAdmin && isLoading && pages.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--tp-buttons)]"></div>
        <span className="ml-3">Cargando panel de administración...</span>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          No tienes permisos para acceder al panel de administración de páginas.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusIcon = (status: PageStatus) => {
    switch (status) {
      case 'public': return <Globe className="h-4 w-4 text-green-600" />;
      case 'draft': return <FileText className="h-4 w-4 text-yellow-600" />;
      case 'private': return <Lock className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeVariant = (status: PageStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'public': return 'default';
      case 'draft': return 'secondary';  
      case 'private': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredPages = pages.filter(page => {
    if (filter.search && !page.route_path.toLowerCase().includes(filter.search.toLowerCase()) && 
        !page.page_title?.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.status && page.status !== filter.status) return false;
    if (filter.country && page.country_code !== filter.country) return false;
    if (filter.section && page.section !== filter.section) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Páginas
          </h1>
          <p className="text-gray-600">
            Controla la visibilidad, SEO y permisos de todas las páginas del sitio
          </p>
        </div>
        
        <Button onClick={() => setShowAddForm(true)} className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Página
        </Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pages">
            <Settings className="h-4 w-4 mr-2" />
            Páginas
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estadísticas
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Shield className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Buscar</Label>
                    <Input
                      id="search"
                      placeholder="Ruta o título..."
                      value={filter.search || ''}
                      onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select onValueChange={(value) => setFilter(prev => ({ ...prev, status: value as PageStatus }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="public">Público</SelectItem>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="private">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="country">País</Label>
                    <Select onValueChange={(value) => setFilter(prev => ({ ...prev, country: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los países" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="cl">Chile 🇨🇱</SelectItem>
                        <SelectItem value="mx">México 🇲🇽</SelectItem>
                        <SelectItem value="co">Colombia 🇨🇴</SelectItem>
                        <SelectItem value="pe">Perú 🇵🇪</SelectItem>
                        <SelectItem value="ar">Argentina 🇦🇷</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="section">Sección</Label>
                    <Select onValueChange={(value) => setFilter(prev => ({ ...prev, section: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las secciones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="home">Inicio</SelectItem>
                        <SelectItem value="firmas">Firmas</SelectItem>
                        <SelectItem value="precios">Precios</SelectItem>
                        <SelectItem value="contacto">Contacto</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Páginas */}
            <div className="grid gap-4">
              {filteredPages.map((page) => (
                <Card key={page.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(page.status)}
                          <h3 className="font-semibold text-lg">
                            {page.page_title || page.route_path}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(page.status)}>
                            {page.status}
                          </Badge>
                          {page.country_code && (
                            <Badge variant="outline">
                              {page.country_code.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {page.route_path}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {page.seo_index ? (
                              <Search className="h-3 w-3 mr-1 text-green-600" />
                            ) : (
                              <EyeOff className="h-3 w-3 mr-1 text-gray-400" />
                            )}
                            {page.seo_index ? 'Indexable' : 'No indexable'}
                          </div>
                          
                          {page.section && (
                            <span>Sección: {page.section}</span>
                          )}
                          
                          <span>Roles: {page.allowed_roles?.join(', ') || 'public'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={page.seo_index}
                          onCheckedChange={() => toggleSeoIndex(page.route_path)}
                        />
                        <span className="text-xs text-gray-500">SEO</span>
                        
                        <Select 
                          value={page.status} 
                          onValueChange={(value) => updatePageStatus(page.route_path, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Público</SelectItem>
                            <SelectItem value="draft">Borrador</SelectItem>
                            <SelectItem value="private">Privado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingPage(page)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPages.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No se encontraron páginas con los filtros aplicados</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Páginas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_pages || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Páginas Públicas</CardTitle>
                <Globe className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.public_pages || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Desarrollo</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.draft_pages || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Indexadas SEO</CardTitle>
                <Search className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.indexed_pages || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución por país */}
          {stats?.by_country && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Distribución por País</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.by_country).map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="capitalize">{country === 'global' ? '🌍 Global' : `🇨🇱 ${country.toUpperCase()}`}</span>
                      <Badge variant="outline">{count} páginas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribución por sección */}
          {stats?.by_section && (
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Sección</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.by_section).map(([section, count]) => (
                    <div key={section} className="flex items-center justify-between">
                      <span className="capitalize">{section}</span>
                      <Badge variant="outline">{count} páginas</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
              <CardDescription>
                Configuración avanzada del sistema de gestión de páginas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Esta sección estará disponible en futuras actualizaciones para configurar 
                    políticas globales, roles personalizados y automatizaciones.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
