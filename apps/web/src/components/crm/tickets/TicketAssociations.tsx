'use client';

/**
 * TicketAssociations
 * Muestra empresas y negocios asociados al ticket (columna derecha)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, Plus } from 'lucide-react';
import Link from 'next/link';

interface TicketAssociationsProps {
  ticketId: string;
  companyId?: string;
  companyName?: string;
  companyDomain?: string;
  className?: string;
}

export function TicketAssociations({
  ticketId,
  companyId,
  companyName,
  companyDomain,
  className = ''
}: TicketAssociationsProps) {
  return (
    <div className={className}>
      {/* Empresas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <CardTitle className="text-base">Empresas</CardTitle>
              {companyId && <Badge variant="secondary">1</Badge>}
            </div>
            <Button variant="ghost" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {companyId ? (
            <div className="space-y-2">
              <div className="p-3 border rounded-lg">
                <Link
                  href={`/dashboard/crm/companies/${companyId}`}
                  className="font-medium text-sm hover:text-[var(--tp-buttons)]"
                >
                  {companyName || '-- Principal'}
                </Link>
                {companyDomain && (
                  <p className="text-xs text-muted-foreground mt-1">{companyDomain}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay empresas asociadas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Negocios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <CardTitle className="text-base">Negocios</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay negocios asociados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

