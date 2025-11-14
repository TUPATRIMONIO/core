/**
 * Organization Context
 * Maneja el estado de la organización actual para usuarios multi-tenant
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  settings: Record<string, any>;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  switchOrganization: (orgId: string) => Promise<void>;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Obtener organizaciones del usuario
      const { data: orgUsers, error } = await supabase
        .from('organization_users')
        .select(`
          organization:organizations(
            id,
            name,
            slug,
            org_type,
            settings
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading organizations:', error);
        setIsLoading(false);
        return;
      }

      if (orgUsers && orgUsers.length > 0) {
        const orgList = orgUsers
          .map((ou: any) => ou.organization)
          .filter((org: any) => org !== null) as Organization[];
        
        setOrganizations(orgList);
        
        // Cargar última org activa del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('last_active_organization_id')
          .eq('id', user.id)
          .single();

        const lastOrgId = userData?.last_active_organization_id;
        const lastOrg = orgList.find(o => o.id === lastOrgId);
        
        setCurrentOrganization(lastOrg || orgList[0]);
      }
    } catch (error) {
      console.error('Error in loadOrganizations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchOrganization(orgId: string) {
    const org = organizations.find(o => o.id === orgId);
    if (!org) return;

    setCurrentOrganization(org);
    
    // Guardar preferencia
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ last_active_organization_id: orgId })
        .eq('id', user.id);
    }
  }

  return (
    <OrganizationContext.Provider 
      value={{
        currentOrganization,
        organizations,
        switchOrganization,
        isLoading
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}







