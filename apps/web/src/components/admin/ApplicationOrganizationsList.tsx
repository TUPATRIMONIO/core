'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ApplicationOrg {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_type: string;
  organization_status: string;
  is_enabled: boolean;
  enabled_at: string | null;
  config: Record<string, any> | null;
}

interface ApplicationOrganizationsListProps {
  applicationId: string;
}

export function ApplicationOrganizationsList({ applicationId }: ApplicationOrganizationsListProps) {
  const [organizations, setOrganizations] = useState<ApplicationOrg[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<ApplicationOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ total: 0, enabled: 0, disabled: 0 });

  useEffect(() => {
    fetchOrganizations();
  }, [applicationId]);

  useEffect(() => {
    // Filtrar por búsqueda
    const filtered = organizations.filter(
      (org) =>
        org.organization_name.toLowerCase().includes(search.toLowerCase()) ||
        org.organization_slug.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredOrgs(filtered);
  }, [search, organizations]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/applications/${applicationId}/organizations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error obteniendo organizaciones');
      }

      setOrganizations(data.organizations || []);
      setFilteredOrgs(data.organizations || []);
      setSummary(data.summary || { total: 0, enabled: 0, disabled: 0 });
    } catch (error: any) {
      toast.error(error.message || 'Error cargando organizaciones');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrg = async (org: ApplicationOrg) => {
    try {
      setToggling(org.organization_id);
      const response = await fetch(`/api/admin/applications/${applicationId}/organizations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org.organization_id,
          is_enabled: !org.is_enabled,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error actualizando');
      }

      // Actualizar estado local
      setOrganizations((prev) =>
        prev.map((o) =>
          o.organization_id === org.organization_id
            ? { ...o, is_enabled: !o.is_enabled }
            : o
        )
      );

      // Actualizar summary
      setSummary((prev) => ({
        ...prev,
        enabled: prev.enabled + (org.is_enabled ? -1 : 1),
        disabled: prev.disabled + (org.is_enabled ? 1 : -1),
      }));

      toast.success(
        !org.is_enabled
          ? `App habilitada para ${org.organization_name}`
          : `App deshabilitada para ${org.organization_name}`
      );
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    } finally {
      setToggling(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      business: 'Empresa',
      personal: 'Personal',
      platform: 'Plataforma',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="outline">{summary.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-600">Habilitadas:</span>
          <Badge className="bg-green-100 text-green-800">{summary.enabled}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Deshabilitadas:</span>
          <Badge variant="secondary">{summary.disabled}</Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar organización..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {filteredOrgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {search ? 'No hay organizaciones que coincidan' : 'No hay organizaciones'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
          {filteredOrgs.map((org) => (
            <div
              key={org.organization_id}
              className="flex items-center justify-between p-3 hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/organizations/${org.organization_id}`}
                    className="font-medium text-sm hover:underline truncate"
                  >
                    {org.organization_name}
                  </Link>
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(org.organization_type)}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(org.organization_status)}`}>
                    {org.organization_status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {org.organization_slug}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-2">
                {org.is_enabled && org.enabled_at && (
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    Desde {new Date(org.enabled_at).toLocaleDateString('es-CL')}
                  </span>
                )}
                {toggling === org.organization_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    checked={org.is_enabled}
                    onCheckedChange={() => toggleOrg(org)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
