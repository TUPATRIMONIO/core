/**
 * Hook para verificación de acceso a páginas
 * Proporciona funcionalidades de autenticación y autorización para el sistema de gestión de páginas
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { pageManager, type PageAccessResult, type UserRole } from '@/lib/page-management';

interface UsePageAccessOptions {
  redirectTo404?: boolean; // Si debe redirigir a 404 cuando no hay acceso
  redirectToLogin?: boolean; // Si debe redirigir al login para páginas privadas
  showLoadingState?: boolean; // Si debe mostrar estado de carga mientras verifica
}

interface PageAccessState {
  isLoading: boolean;
  hasAccess: boolean;
  pageConfig: PageAccessResult | null;
  userRole: UserRole;
  error: string | null;
}

export function usePageAccess(options: UsePageAccessOptions = {}) {
  const {
    redirectTo404 = true,
    redirectToLogin = false,
    showLoadingState = true
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  
  const [state, setState] = useState<PageAccessState>({
    isLoading: showLoadingState,
    hasAccess: true, // Por defecto asumimos acceso hasta verificar
    pageConfig: null,
    userRole: 'public',
    error: null
  });

  useEffect(() => {
    checkPageAccess();
  }, [pathname]);

  const checkPageAccess = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Obtener rol del usuario
      const userRole = await pageManager.getUserRole(userId);

      // Verificar acceso a la página
      const pageConfig = await pageManager.canUserAccessPage(pathname, userId);

      setState({
        isLoading: false,
        hasAccess: pageConfig.has_access,
        pageConfig,
        userRole,
        error: null
      });

      // Manejar redirecciones si no hay acceso
      if (!pageConfig.has_access) {
        if (redirectToLogin && pageConfig.status === 'private' && !userId) {
          // Redirigir al login para páginas privadas sin usuario autenticado
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        
        if (redirectTo404) {
          // Redirigir a 404 para cualquier página sin acceso
          router.push('/404');
          return;
        }
      }

    } catch (error) {
      console.error('Error checking page access:', error);
      setState({
        isLoading: false,
        hasAccess: true, // En caso de error, permitir acceso por defecto
        pageConfig: {
          status: 'public',
          seo_index: true,
          allowed_roles: ['public'],
          has_access: true
        },
        userRole: 'public',
        error: error instanceof Error ? error.message : 'Error verificando acceso'
      });
    }
  };

  return {
    ...state,
    refetch: checkPageAccess
  };
}

/**
 * Hook específico para obtener el estado de una página
 */
export function usePageStatus(routePath?: string) {
  const pathname = usePathname();
  const targetPath = routePath || pathname;
  const supabase = createClient();
  
  const [pageStatus, setPageStatus] = useState<PageAccessResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPageStatus();
  }, [targetPath]);

  const fetchPageStatus = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const status = await pageManager.canUserAccessPage(targetPath, user?.id);
      
      setPageStatus(status);
    } catch (error) {
      console.error('Error fetching page status:', error);
      setPageStatus({
        status: 'public',
        seo_index: true,
        allowed_roles: ['public'],
        has_access: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pageStatus,
    isLoading,
    refetch: fetchPageStatus
  };
}

/**
 * Hook para verificar si el usuario actual es administrador
 */
export function useIsAdmin() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const role = await pageManager.getUserRole(user.id);
      setIsAdmin(['admin', 'super_admin'].includes(role));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    refetch: checkAdminStatus
  };
}

/**
 * Hook para gestión en tiempo real de páginas (solo para administradores)
 */
export function usePageManagement() {
  const { isAdmin } = useIsAdmin();
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchPages = async (filters?: any) => {
    if (!isAdmin) return;
    
    try {
      setIsLoading(true);
      const data = await pageManager.getAllPages(filters);
      setPages(data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isAdmin) return;
    
    try {
      const data = await pageManager.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updatePageStatus = async (routePath: string, status: string) => {
    if (!isAdmin) return false;
    
    try {
      const existingConfig = await pageManager.getPageConfig(routePath);
      if (!existingConfig) return false;

      await pageManager.upsertPageConfig({
        ...existingConfig,
        status: status as any
      });
      
      await fetchPages();
      return true;
    } catch (error) {
      console.error('Error updating page status:', error);
      return false;
    }
  };

  const toggleSeoIndex = async (routePath: string) => {
    if (!isAdmin) return false;
    
    try {
      const existingConfig = await pageManager.getPageConfig(routePath);
      if (!existingConfig) return false;

      await pageManager.upsertPageConfig({
        ...existingConfig,
        seo_index: !existingConfig.seo_index
      });
      
      await fetchPages();
      return true;
    } catch (error) {
      console.error('Error toggling SEO index:', error);
      return false;
    }
  };

  return {
    pages,
    stats,
    isLoading,
    isAdmin,
    fetchPages,
    fetchStats,
    updatePageStatus,
    toggleSeoIndex
  };
}
