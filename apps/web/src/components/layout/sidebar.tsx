'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  PenTool,
  Stamp,
  Users,
  Settings,
  CreditCard,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissionsStore } from '@/stores/permissions-store'
import { OrgSwitcher } from './org-switcher'

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permission?: {
    schema: string
    action: string
  }
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Firma Electrónica',
    href: '/dashboard/signatures',
    icon: PenTool,
    permission: { schema: 'signatures', action: 'view' },
  },
  {
    title: 'Servicios Notariales',
    href: '/dashboard/notary',
    icon: Stamp,
    permission: { schema: 'notary', action: 'view' },
  },
  {
    title: 'CRM',
    href: '/dashboard/crm',
    icon: Users,
    permission: { schema: 'crm', action: 'view' },
  },
]

const bottomNavItems: NavItem[] = [
  {
    title: 'Créditos',
    href: '/dashboard/credits',
    icon: CreditCard,
  },
  {
    title: 'Organización',
    href: '/dashboard/organization',
    icon: Building2,
    permission: { schema: 'organization', action: 'view' },
  },
  {
    title: 'Configuración',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasPermission } = usePermissionsStore()

  const filterByPermission = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.permission) return true
      return hasPermission(item.permission.schema, item.permission.action)
    })
  }

  const visibleMainItems = filterByPermission(mainNavItems)
  const visibleBottomItems = filterByPermission(bottomNavItems)

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-sidebar">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--tp-brand)] flex items-center justify-center">
              <span className="text-white font-bold text-sm">TP</span>
            </div>
            <span className="font-semibold text-lg">TuPatrimonio</span>
          </Link>
        </div>

        {/* Org Switcher */}
        <div className="px-3 py-4 border-b">
          <OrgSwitcher />
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleMainItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t space-y-1">
          {visibleBottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
