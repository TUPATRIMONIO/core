'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
}

interface OrganizationContextType {
  activeOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  setActiveOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
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
          console.log('[OrganizationProvider] Using first org:', orgToActivate.name);
        }
        
        if (orgToActivate) {
          setActiveOrganizationState(orgToActivate);
          localStorage.setItem(STORAGE_KEY, orgToActivate.id);
          console.log('[OrganizationProvider] Active organization set:', orgToActivate.name);
        } else {
          console.warn('[OrganizationProvider] No organization to activate');
        }
      } else {
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
  const setActiveOrganization = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setActiveOrganizationState(org);
      localStorage.setItem(STORAGE_KEY, orgId);
      
      // Trigger a page reload to refresh all data with new organization context
      window.location.reload();
    }
  };

  // Refresh organizations list
  const refreshOrganizations = async () => {
    setIsLoading(true);
    await fetchOrganizations();
  };

  const value: OrganizationContextType = {
    activeOrganization,
    organizations,
    isLoading,
    setActiveOrganization,
    refreshOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
