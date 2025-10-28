/**
 * Hooks para gestión administrativa de páginas
 * Solo para uso en dashboard administrativo
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { pageManager, type PageConfig, type PageStatus } from '@/lib/page-management';

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

      // Usar la función RPC para verificar acceso admin
      const { data: hasAccess } = await supabase.rpc('can_access_admin', {
        user_id: user.id
      });

      setIsAdmin(hasAccess || false);
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
  const [pages, setPages] = useState<PageConfig[]>([]);
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
        status: status as PageStatus
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
