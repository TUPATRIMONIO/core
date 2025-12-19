'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationApp {
  application_id: string;
  application_slug: string;
  application_name: string;
  application_description: string;
  application_category: string;
  is_globally_active: boolean;
  is_enabled_for_org: boolean;
  enabled_at: string | null;
  config: Record<string, any> | null;
}

interface OrganizationAppsManagerProps {
  organizationId: string;
}

export function OrganizationAppsManager({ organizationId }: OrganizationAppsManagerProps) {
  const [apps, setApps] = useState<OrganizationApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, [organizationId]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/organizations/${organizationId}/apps`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo apps');
      }

      setApps(data.apps || []);
    } catch (error: any) {
      toast.error(error.message || 'Error cargando aplicaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleApp = async (app: OrganizationApp) => {
    if (!app.is_globally_active && !app.is_enabled_for_org) {
      toast.error('Esta aplicación está desactivada globalmente');
      return;
    }

    try {
      setToggling(app.application_id);
      const response = await fetch(`/api/admin/organizations/${organizationId}/apps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: app.application_id,
          is_enabled: !app.is_enabled_for_org,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando app');
      }

      // Actualizar estado local
      setApps((prev) =>
        prev.map((a) =>
          a.application_id === app.application_id
            ? { ...a, is_enabled_for_org: !a.is_enabled_for_org }
            : a
        )
      );

      toast.success(
        !app.is_enabled_for_org
          ? `${app.application_name} habilitada`
          : `${app.application_name} deshabilitada`
      );
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Package className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No hay aplicaciones disponibles</p>
      </div>
    );
  }

  // Agrupar por categoría
  const groupedApps = apps.reduce((acc, app) => {
    const category = app.application_category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(app);
    return acc;
  }, {} as Record<string, OrganizationApp[]>);

  const categoryLabels: Record<string, string> = {
    core: 'Core',
    marketing: 'Marketing',
    sales: 'Ventas',
    support: 'Soporte',
    ai: 'Inteligencia Artificial',
    other: 'Otros',
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedApps).map(([category, categoryApps]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-2">
            {categoryApps.map((app) => (
              <div
                key={app.application_id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  !app.is_globally_active ? 'bg-muted/50 opacity-60' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {app.application_name}
                    </span>
                    {!app.is_globally_active && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Desactivada
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {app.application_slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {toggling === app.application_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Switch
                      checked={app.is_enabled_for_org}
                      onCheckedChange={() => toggleApp(app)}
                      disabled={!app.is_globally_active}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
