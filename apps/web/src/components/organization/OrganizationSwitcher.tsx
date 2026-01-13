'use client';

import { Check, ChevronsUpDown, Building2, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSidebar } from '@/components/ui/sidebar';
import { useOrganization } from '@/hooks/useOrganization';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function OrganizationSwitcher() {
  const { activeOrganization, organizations, isLoading, setActiveOrganization } = useOrganization();
  const { state } = useSidebar();
  const [open, setOpen] = useState(false);

  const isCollapsed = state === 'collapsed';

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">Sin organización</span>
      </div>
    );
  }

  const getOrgInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto px-2 py-1.5 hover:bg-accent",
            isCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-[var(--tp-brand)] text-white text-xs">
                {getOrgInitials(activeOrganization.name)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-semibold truncate w-full">
                  {activeOrganization.name}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {activeOrganization.org_type}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar organización..." />
          <CommandList>
            <CommandEmpty>No se encontraron organizaciones.</CommandEmpty>
            <CommandGroup heading="Mis Organizaciones">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => {
                    setActiveOrganization(org.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6 rounded-md">
                    <AvatarFallback className="rounded-md bg-muted text-xs">
                      {getOrgInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{org.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {org.org_type}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      activeOrganization?.id === org.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  window.location.href = '/onboarding?new=true';
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">Crear nueva organización</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
