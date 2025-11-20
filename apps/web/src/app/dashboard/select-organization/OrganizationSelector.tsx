'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  roleName?: string | null;
  roleSlug?: string | null;
};

interface OrganizationSelectorProps {
  organizations: OrganizationOption[];
  activeOrganizationId: string | null;
}

export function OrganizationSelector({
  organizations,
  activeOrganizationId,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(activeOrganizationId);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (organizationId: string) => {
    if (isPending || organizationId === selectedId) {
      router.push('/dashboard');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/organizations/set-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'No se pudo cambiar de organización');
        }

        setSelectedId(organizationId);
        toast({
          title: 'Organización seleccionada',
          description: 'Actualizamos tu experiencia según la organización elegida.',
        });
        router.push('/dashboard');
        router.refresh();
      } catch (error) {
        console.error('Error setting active organization:', error);
        toast({
          title: 'No pudimos cambiar la organización',
          description: 'Intenta nuevamente en unos segundos.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {organizations.map((org) => {
        const isActive = org.id === selectedId;
        return (
          <Button
            key={org.id}
            type="button"
            variant="outline"
            onClick={() => handleSelect(org.id)}
            className={cn(
              'flex w-full flex-col items-start gap-3 rounded-2xl border-[var(--tp-lines-30)] bg-[var(--tp-background-light)] px-5 py-4 text-left shadow-sm transition hover:border-[var(--tp-buttons)] hover:bg-[var(--tp-background-light)]/80 focus-visible:ring-2 focus-visible:ring-[var(--tp-buttons)] md:flex-row md:items-center md:justify-between',
              isActive && 'border-[var(--tp-buttons)] bg-[var(--tp-buttons-10)]'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--tp-buttons-10)] text-[var(--tp-buttons)]">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold text-[var(--tp-background-dark)]">
                  {org.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {org.org_type === 'platform' ? 'Organización Plataforma' : org.org_type === 'business' ? 'Empresa' : 'Personal'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              {org.roleName && (
                <Badge className="bg-[var(--tp-buttons-20)] text-[var(--tp-buttons)]">
                  {org.roleName}
                </Badge>
              )}
              {isActive ? (
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--tp-buttons)]">
                  <Check className="h-4 w-4" />
                  Activa
                </span>
              ) : isPending ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cambiando...
                </span>
              ) : (
                <span className="text-sm text-[var(--tp-buttons)]">Seleccionar</span>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
