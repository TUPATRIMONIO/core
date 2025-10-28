/**
 * Sistema de Gestión de Páginas - TuPatrimonio Marketing
 * 
 * Proporciona funcionalidades centrales para controlar:
 * - Estados de publicación (público, borrador, privado)
 * - Control de indexación SEO
 * - Permisos de acceso por rol de usuario
 * - Gestión por país y sección
 */

import { createClient } from '@/lib/supabase/client';

export type PageStatus = 'public' | 'draft' | 'private';
export type UserRole = 'public' | 'editor' | 'admin' | 'super_admin';

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

export interface UserRoleConfig {
  id?: string;
  user_id: string;
  role: UserRole;
  permissions?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
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
        .from('marketing.page_management')
        .select('*')
        .eq('route_path', routePath)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 es "not found"
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
      // Usar la función de base de datos para verificar acceso
      const { data, error } = await this.supabase
        .rpc('get_page_status', {
          page_route: routePath,
          user_role: await this.getUserRole(userId)
        });

      if (error) {
        console.error('Error checking page access:', error);
        // Por defecto, permitir acceso público si hay error
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
   * Obtiene el rol de un usuario
   */
  async getUserRole(userId?: string): Promise<UserRole> {
    if (!userId) return 'public';

    try {
      const { data, error } = await this.supabase
        .from('marketing.user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return 'public';
      }

      return data.role as UserRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'public';
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
        .from('marketing.page_management')
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
        .from('marketing.page_management')
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
   */
  async getAllPages(filters?: { 
    status?: PageStatus; 
    country_code?: string; 
    section?: string; 
  }): Promise<PageConfig[]> {
    try {
      let query = this.supabase
        .from('marketing.page_management')
        .select('*')
        .order('route_path');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.country_code) {
        query = query.eq('country_code', filters.country_code);
      }
      if (filters?.section) {
        query = query.eq('section', filters.section);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error getting all pages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPages:', error);
      return [];
    }
  }

  /**
   * Asigna un rol a un usuario
   */
  async assignUserRole(userId: string, role: UserRole, permissions?: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('marketing.user_roles')
        .upsert({ 
          user_id: userId, 
          role, 
          permissions: permissions || {} 
        }, { 
          onConflict: 'user_id',
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
   */
  async getStats(): Promise<{
    total_pages: number;
    public_pages: number;
    draft_pages: number;
    private_pages: number;
    indexed_pages: number;
    by_country: Record<string, number>;
    by_section: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('marketing.page_management')
        .select('status, country_code, section, seo_index');

      if (error) {
        console.error('Error getting stats:', error);
        return {
          total_pages: 0,
          public_pages: 0,
          draft_pages: 0,
          private_pages: 0,
          indexed_pages: 0,
          by_country: {},
          by_section: {}
        };
      }

      const pages = data || [];
      const stats = {
        total_pages: pages.length,
        public_pages: pages.filter(p => p.status === 'public').length,
        draft_pages: pages.filter(p => p.status === 'draft').length,
        private_pages: pages.filter(p => p.status === 'private').length,
        indexed_pages: pages.filter(p => p.seo_index).length,
        by_country: {} as Record<string, number>,
        by_section: {} as Record<string, number>
      };

      // Agrupar por país
      pages.forEach(page => {
        const country = page.country_code || 'global';
        stats.by_country[country] = (stats.by_country[country] || 0) + 1;
      });

      // Agrupar por sección
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
        indexed_pages: 0,
        by_country: {},
        by_section: {}
      };
    }
  }
}

// Instancia singleton para usar en toda la aplicación
export const pageManager = new PageManagement();

// Funciones de utilidad para usar en componentes
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
