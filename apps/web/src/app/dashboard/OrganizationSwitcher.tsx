'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  orgType: string;
  roleName?: string | null;
}

interface OrganizationSwitcherProps {
  organizations: OrganizationSummary[];
  activeOrganizationId: string | null;
}

export function OrganizationSwitcher({ organizations, activeOrganizationId }: OrganizationSwitcherProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const hasMultiple = organizations.length > 1;
  const activeOrg = organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0] ?? null;

  const handleChange = (organizationId: string) => {
    if (!hasMultiple || !organizationId || organizationId === activeOrganizationId) {
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
          throw new Error(data?.error || 'No pudimos cambiar la organización');
        }

        toast({
          title: 'Organización actualizada',
          description: 'Recargamos tu panel con la nueva organización.',
        });

        // Forzar recarga completa de la página
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error switching organization:', error);
        toast({
          title: 'No logramos cambiar la organización',
          description: 'Vuelve a intentarlo en unos instantes.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!activeOrg) {
    return null;
  }

  const triggerLabel = `${activeOrg.name}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={!hasMultiple || isPending}>
        <Button
          variant="outline"
          className={cn(
            'flex items-center gap-2 rounded-full border-[var(--tp-lines-30)] bg-[var(--tp-background-light)] px-4 py-2 text-sm font-medium text-[var(--tp-background-dark)] shadow-sm transition hover:border-[var(--tp-buttons)] hover:text-[var(--tp-buttons)]',
            !hasMultiple && 'cursor-default opacity-90 hover:border-[var(--tp-lines-30)] hover:text-[var(--tp-background-dark)]'
          )}
        >
          <Building2 className="h-4 w-4 text-[var(--tp-buttons)]" />
          <span className="hidden sm:inline">
            {triggerLabel}
          </span>
          <span className="inline sm:hidden">{activeOrg.slug}</span>
          {!hasMultiple ? (
            <span className="ml-2 rounded-full bg-[var(--tp-buttons-20)] px-2 py-0.5 text-xs text-[var(--tp-buttons)]">
              {activeOrg.roleName || 'Mi organización'}
            </span>
          ) : (
            <span className="ml-2 rounded-full bg-[var(--tp-buttons-20)] px-2 py-0.5 text-xs text-[var(--tp-buttons)]">
              {isPending ? 'Actualizando…' : 'Cambiar'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      {hasMultiple && (
        <DropdownMenuContent className="w-64 bg-[var(--tp-background-light)]">
          <DropdownMenuLabel className="text-sm text-[var(--tp-background-dark)]">
            Selecciona una organización
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[var(--tp-lines-30)]" />
          <DropdownMenuRadioGroup
            value={activeOrganizationId ?? ''}
            onValueChange={handleChange}
          >
            {organizations.map((org) => (
              <DropdownMenuRadioItem
                key={org.id}
                value={org.id}
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-[var(--tp-background-dark)] focus:bg-[var(--tp-buttons-10)] focus:text-[var(--tp-background-dark)]"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="font-semibold">{org.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {org.orgType === 'platform'
                      ? 'Organización plataforma'
                      : org.orgType === 'business'
                      ? 'Empresa'
                      : 'Cuenta personal'}
                  </span>
                </div>
                {org.id === activeOrganizationId ? (
                  <Check className="h-4 w-4 text-[var(--tp-buttons)]" />
                ) : isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
}

