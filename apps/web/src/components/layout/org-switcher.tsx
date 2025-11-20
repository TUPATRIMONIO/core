'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function OrgSwitcher() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { memberships, currentOrganization, setCurrentOrganization } = useAuthStore()

  const handleSelect = (organizationId: string) => {
    const membership = memberships.find(m => m.organization_id === organizationId)
    if (membership) {
      setCurrentOrganization(membership.organization)
      setOpen(false)
      // Optionally refresh the page or redirect
      router.refresh()
    }
  }

  if (!currentOrganization) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        Selecciona una organización
      </div>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm rounded-md',
            'bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-sidebar-ring'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium">
                {currentOrganization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="truncate font-medium">{currentOrganization.name}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization_id}
            onSelect={() => handleSelect(membership.organization_id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium">
                  {membership.organization.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm">{membership.organization.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {typeof membership.role === 'string' 
                    ? membership.role.replace('org_', '')
                    : membership.role?.slug?.replace('org_', '') || 'member'}
                </span>
              </div>
            </div>
            {currentOrganization.id === membership.organization_id && (
              <Check className="h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => router.push('/dashboard/organization/new')}
          className="cursor-pointer"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear organización
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
