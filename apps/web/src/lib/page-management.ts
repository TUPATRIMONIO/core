/**
 * Sistema de Gestión de Páginas - TuPatrimonio
 * 
 * Proporciona funcionalidades centrales para controlar:
 * - Estados de publicación (público, borrador, privado)
 * - Control de indexación SEO
 * - Permisos de acceso por rol de usuario (usando core.roles)
 * - Gestión por país y sección
 * 
 * NOTA: Las páginas estáticas se leen desde la API de marketing (page-config.ts)
 * en lugar de la base de datos. Esta es la fuente de verdad única.
 * 
 * SISTEMA DE ROLES: Usa core.roles + core.organization_users (unificado)
 */

import { createClient } from '@/lib/supabase/client';

export type PageStatus = 'public' | 'draft' | 'private' | 'coming-soon';

export interface PageConfig {
  id?: string;
  route_path: string;
  page_title?: string;
  status: PageStatus;
  seo_index: boolean;
  allowed_roles: string[];
  country_code?: string;
  section?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface PageAccessResult {
  status: PageStatus;
  seo_index: boolean;
  allowed_roles: string[];
  has_access: boolean;
}

/**
 * Clase principal para gestión de páginas
 */
export class PageManagement {
  private supabase = createClient();

  /**
   * Obtiene la configuración de una página específica
   */
  async getPageConfig(routePath: string): Promise<PageConfig | null> {
    try {
      const { data, error } = await this.supabase
        .schema('marketing')
        .from('page_management')
        .select('*')
        .eq('route_path', routePath)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting page config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPageConfig:', error);
      return null;
    }
  }

  /**
   * Verifica si un usuario puede acceder a una página
   */
  async canUserAccessPage(routePath: string, userId?: string): Promise<PageAccessResult> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_page_status', {
          page_route: routePath,
          user_role: 'public' // El RPC ya maneja la verificación con core.roles
        });

      if (error) {
        console.error('Error checking page access:', error);
        return {
          status: 'public',
          seo_index: true,
          allowed_roles: ['public'],
          has_access: true
        };
      }

      return data[0] || {
        status: 'public',
        seo_index: true,
        allowed_roles: ['public'],
        has_access: true
      };
    } catch (error) {
      console.error('Error in canUserAccessPage:', error);
      return {
        status: 'public',
        seo_index: true,
        allowed_roles: ['public'],
        has_access: true
      };
    }
  }

  /**
   * Verifica si un usuario es admin de plataforma
   * Usa el sistema unificado core.roles
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('can_access_admin', { user_id: userId });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in isUserAdmin:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las páginas públicas para el sitemap
   */
  async getPublicPages(): Promise<Array<{ route_path: string; seo_index: boolean; updated_at: string }>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_public_pages');

      if (error) {
        console.error('Error getting public pages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPublicPages:', error);
      return [];
    }
  }

  /**
   * Crea o actualiza la configuración de una página
   */
  async upsertPageConfig(config: Omit<PageConfig, 'id' | 'created_at' | 'updated_at'>): Promise<PageConfig | null> {
    try {
      const { data, error } = await this.supabase
        .schema('marketing')
        .from('page_management')
        .upsert(config, { 
          onConflict: 'route_path',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting page config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertPageConfig:', error);
      return null;
    }
  }

  /**
   * Elimina la configuración de una página
   */
  async deletePageConfig(routePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .schema('marketing')
        .from('page_management')
        .delete()
        .eq('route_path', routePath);

      if (error) {
        console.error('Error deleting page config:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePageConfig:', error);
      return false;
    }
  }

  /**
   * Obtiene todas las páginas con su configuración
   * Lee desde la API proxy que conecta con marketing (page-config.ts)
   */
  async getAllPages(filters?: { 
    status?: PageStatus; 
    country_code?: string; 
    section?: string; 
  }): Promise<PageConfig[]> {
    try {
      // Consultar API proxy local (evita problemas de CORS)
      const response = await fetch('/api/pages-config', {
        cache: 'no-store', // Siempre obtener datos frescos
      });

      if (!response.ok) {
        console.error('Error fetching pages config:', response.statusText);
        return [];
      }

      let pages: PageConfig[] = await response.json();

      // Aplicar filtros si existen
      if (filters?.status) {
        pages = pages.filter(p => p.status === filters.status);
      }
      if (filters?.country_code) {
        pages = pages.filter(p => p.country_code === filters.country_code);
      }
      if (filters?.section) {
        pages = pages.filter(p => p.section === filters.section);
      }

      // Ordenar por ruta
      pages.sort((a, b) => a.route_path.localeCompare(b.route_path));

      return pages;
    } catch (error) {
      console.error('Error in getAllPages:', error);
      return [];
    }
  }

  /**
   * Asigna un rol a un usuario en la organización platform
   * Usa el sistema unificado core.roles
   */
  async assignUserRole(userId: string, roleSlug: 'platform_super_admin' | 'marketing_admin' | 'sales_manager'): Promise<boolean> {
    try {
      // Obtener platform org ID y role ID
      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('org_type', 'platform')
        .single();

      if (!orgData) {
        console.error('Platform organization not found');
        return false;
      }

      const { data: roleData } = await this.supabase
        .from('roles')
        .select('id')
        .eq('slug', roleSlug)
        .single();

      if (!roleData) {
        console.error('Role not found:', roleSlug);
        return false;
      }

      // Insertar en organization_users
      const { error } = await this.supabase
        .from('organization_users')
        .upsert({ 
          organization_id: orgData.id,
          user_id: userId, 
          role_id: roleData.id,
          status: 'active'
        }, { 
          onConflict: 'organization_id,user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error assigning user role:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in assignUserRole:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del sistema
   * Calcula stats desde los datos de la API
   */
  async getStats(): Promise<{
    total_pages: number;
    public_pages: number;
    draft_pages: number;
    private_pages: number;
    coming_soon_pages: number;
    indexed_pages: number;
    by_country: Record<string, number>;
    by_section: Record<string, number>;
  }> {
    try {
      // Obtener todas las páginas desde la API
      const pages = await this.getAllPages();

      if (!pages || pages.length === 0) {
        return {
          total_pages: 0,
          public_pages: 0,
          draft_pages: 0,
          private_pages: 0,
          coming_soon_pages: 0,
          indexed_pages: 0,
          by_country: {},
          by_section: {}
        };
      }

      const stats = {
        total_pages: pages.length,
        public_pages: pages.filter(p => p.status === 'public').length,
        draft_pages: pages.filter(p => p.status === 'draft').length,
        private_pages: pages.filter(p => p.status === 'private').length,
        coming_soon_pages: pages.filter(p => p.status === 'coming-soon').length,
        indexed_pages: pages.filter(p => p.seo_index).length,
        by_country: {} as Record<string, number>,
        by_section: {} as Record<string, number>
      };

      pages.forEach(page => {
        const country = page.country_code || 'global';
        stats.by_country[country] = (stats.by_country[country] || 0) + 1;
      });

      pages.forEach(page => {
        const section = page.section || 'otros';
        stats.by_section[section] = (stats.by_section[section] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        total_pages: 0,
        public_pages: 0,
        draft_pages: 0,
        private_pages: 0,
        coming_soon_pages: 0,
        indexed_pages: 0,
        by_country: {},
        by_section: {}
      };
    }
  }
}

export const pageManager = new PageManagement();

export async function getPageStatus(routePath: string, userId?: string): Promise<PageAccessResult> {
  return await pageManager.canUserAccessPage(routePath, userId);
}

export async function canAccessPage(routePath: string, userId?: string): Promise<boolean> {
  const result = await pageManager.canUserAccessPage(routePath, userId);
  return result.has_access;
}

export async function shouldIndexPage(routePath: string): Promise<boolean> {
  const result = await pageManager.canUserAccessPage(routePath);
  return result.seo_index && result.status === 'public';
}

export async function getPublicPagesForSitemap() {
  return await pageManager.getPublicPages();
}
