'use client';

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

// =====================================================
// Interfaces para el sistema de control de acceso
// =====================================================

export interface OrganizationMembership {
  role_id: string | null;
  role_name: string | null;
  role_slug: string | null;
  role_level: number;
  permissions: Record<string, any>;
  additional_permissions: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  membership: OrganizationMembership;
  enabled_apps: string[];
}

interface OrganizationContextType {
  // Estado principal
  activeOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  
  // Métodos de gestión
  setActiveOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  
  // Helpers de acceso (nivel organización)
  hasApp: (appSlug: string) => boolean;
  getEnabledApps: () => string[];
  
  // Helpers de permisos (nivel miembro)
  hasPermission: (permission: string) => boolean;
  hasRole: (roleSlug: string) => boolean;
  getRoleSlug: () => string | null;
  getRoleLevel: () => number;
  
  // Helpers de conveniencia
  isAdmin: () => boolean;
  isOwner: () => boolean;
  canManageOrg: () => boolean;
}

export const OrganizationContext = createContext<OrganizationContextType | null>(null);

const STORAGE_KEY = 'tupatrimonio_active_org_id';

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganization, setActiveOrganizationState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      console.log('[OrganizationProvider] Fetching organizations...');
      const response = await fetch('/api/organizations/user');
      
      if (response.status === 401) {
        console.log('[OrganizationProvider] Usuario no autenticado, operando en modo invitado.');
        setOrganizations([]);
        setActiveOrganizationState(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      console.log('[OrganizationProvider] API Response:', data);

      if (data.success && data.data) {
        console.log('[OrganizationProvider] Organizations found:', data.data.length);
        setOrganizations(data.data);
        
        // Get saved organization ID from localStorage
        const savedOrgId = localStorage.getItem(STORAGE_KEY);
        console.log('[OrganizationProvider] Saved org ID from localStorage:', savedOrgId);
        
        // Find the saved organization or use the first one
        let orgToActivate: Organization | null = null;
        
        if (savedOrgId) {
          orgToActivate = data.data.find((org: Organization) => org.id === savedOrgId) || null;
          console.log('[OrganizationProvider] Found saved org:', orgToActivate?.name);
        }
        
        // If no saved org or saved org not found, use first organization
        if (!orgToActivate && data.data.length > 0) {
          orgToActivate = data.data[0];
          console.log('[OrganizationProvider] Using first org:', orgToActivate?.name);
        }
        
        if (orgToActivate) {
          setActiveOrganizationState(orgToActivate);
          localStorage.setItem(STORAGE_KEY, orgToActivate.id);
          console.log('[OrganizationProvider] Active organization set:', orgToActivate.name);
          console.log('[OrganizationProvider] Membership:', orgToActivate.membership);
          console.log('[OrganizationProvider] Enabled apps:', orgToActivate.enabled_apps);
        } else {
          console.log('[OrganizationProvider] No hay organización para activar (modo invitado o nuevo usuario).');
        }
      } else if (response.status !== 401) {
        console.error('[OrganizationProvider] API returned no data or error:', data);
      }
    } catch (error) {
      console.error('[OrganizationProvider] Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Set active organization
  const setActiveOrganization = async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setActiveOrganizationState(org);
      localStorage.setItem(STORAGE_KEY, orgId);
      
      // Update last_active_organization_id in database
      try {
        await fetch('/api/organizations/set-active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_id: orgId }),
        });
      } catch (error) {
        console.error('[OrganizationProvider] Error updating active org in DB:', error);
      }
      
      // Trigger a page reload to refresh all data with new organization context
      window.location.reload();
    }
  };

  // Refresh organizations list
  const refreshOrganizations = async () => {
    setIsLoading(true);
    await fetchOrganizations();
  };

  // =====================================================
  // Helpers de acceso a apps (nivel organización)
  // =====================================================

  const hasApp = useCallback((appSlug: string): boolean => {
    return activeOrganization?.enabled_apps?.includes(appSlug) ?? false;
  }, [activeOrganization]);

  const getEnabledApps = useCallback((): string[] => {
    return activeOrganization?.enabled_apps ?? [];
  }, [activeOrganization]);

  // =====================================================
  // Helpers de permisos (nivel miembro)
  // =====================================================

  const hasPermission = useCallback((permission: string): boolean => {
    if (!activeOrganization?.membership) return false;
    
    // Verificar en permisos del rol
    const rolePermissions = activeOrganization.membership.permissions || {};
    // Verificar en permisos adicionales específicos del usuario
    const additionalPermissions = activeOrganization.membership.additional_permissions || {};
    
    // El permiso puede estar en formato "module.action" (ej: "crm.edit")
    // o en formato simple "permission" (ej: "admin")
    const parts = permission.split('.');
    
    if (parts.length === 2) {
      const [module, action] = parts;
      // Verificar en permisos del rol: permissions.crm.edit
      if (rolePermissions[module]?.[action] === true) return true;
      // Verificar en permisos adicionales
      if (additionalPermissions[module]?.[action] === true) return true;
    } else {
      // Permiso simple
      if (rolePermissions[permission] === true) return true;
      if (additionalPermissions[permission] === true) return true;
    }
    
    return false;
  }, [activeOrganization]);

  const hasRole = useCallback((roleSlug: string): boolean => {
    return activeOrganization?.membership?.role_slug === roleSlug;
  }, [activeOrganization]);

  const getRoleSlug = useCallback((): string | null => {
    return activeOrganization?.membership?.role_slug ?? null;
  }, [activeOrganization]);

  const getRoleLevel = useCallback((): number => {
    return activeOrganization?.membership?.role_level ?? 0;
  }, [activeOrganization]);

  // =====================================================
  // Helpers de conveniencia
  // =====================================================

  const isAdmin = useCallback((): boolean => {
    const roleSlug = activeOrganization?.membership?.role_slug;
    return roleSlug === 'admin' || roleSlug === 'owner';
  }, [activeOrganization]);

  const isOwner = useCallback((): boolean => {
    return activeOrganization?.membership?.role_slug === 'owner';
  }, [activeOrganization]);

  const canManageOrg = useCallback((): boolean => {
    // Nivel >= 8 generalmente indica permisos de gestión
    return getRoleLevel() >= 8 || isAdmin();
  }, [getRoleLevel, isAdmin]);

  // =====================================================
  // Valor del contexto
  // =====================================================

  const value: OrganizationContextType = {
    // Estado
    activeOrganization,
    organizations,
    isLoading,
    
    // Gestión
    setActiveOrganization,
    refreshOrganizations,
    
    // Helpers de apps
    hasApp,
    getEnabledApps,
    
    // Helpers de permisos
    hasPermission,
    hasRole,
    getRoleSlug,
    getRoleLevel,
    
    // Conveniencia
    isAdmin,
    isOwner,
    canManageOrg,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

