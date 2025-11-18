'use client';

/**
 * useEntityProperties Hook
 * Hook para cargar y gestionar entity properties
 */

import { useState, useEffect } from 'react';
import { EntityProperty, EntityType } from '@/types/crm';

interface UseEntityPropertiesOptions {
  entityType: EntityType;
  visibleOnly?: boolean;
  autoFetch?: boolean;
}

interface UseEntityPropertiesReturn {
  properties: EntityProperty[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getProperty: (key: string) => EntityProperty | undefined;
  getRequiredProperties: () => EntityProperty[];
}

export function useEntityProperties({
  entityType,
  visibleOnly = true,
  autoFetch = true
}: UseEntityPropertiesOptions): UseEntityPropertiesReturn {
  const [properties, setProperties] = useState<EntityProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        entity_type: entityType,
        ...(visibleOnly && { is_visible: 'true' })
      });

      const response = await fetch(`/api/crm/entity-properties?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar propiedades');
      }

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('Error fetching entity properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchProperties();
    }
  }, [entityType, visibleOnly, autoFetch]);

  const getProperty = (key: string): EntityProperty | undefined => {
    return properties.find(p => p.property_key === key);
  };

  const getRequiredProperties = (): EntityProperty[] => {
    return properties.filter(p => p.is_required);
  };

  return {
    properties,
    loading,
    error,
    refresh: fetchProperties,
    getProperty,
    getRequiredProperties
  };
}


