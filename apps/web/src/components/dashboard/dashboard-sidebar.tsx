'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Wallet,
  Settings,
  ChevronRight,
  LogOut,
  Contact,
  Building2,
  TrendingUp,
  Ticket,
  Package,
  BookOpen,
  FileText,
  BarChart3,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const mainMenuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
]

const crmMenuItems = [
  {
    title: 'CRM',
    url: '/dashboard/crm',
    icon: Contact,
  },
  {
    title: 'Contactos',
    url: '/dashboard/crm/contacts',
    icon: Contact,
  },
  {
    title: 'Empresas',
    url: '/dashboard/crm/companies',
    icon: Building2,
  },
  {
    title: 'Deals',
    url: '/dashboard/crm/deals',
    icon: TrendingUp,
  },
  {
    title: 'Tickets',
    url: '/dashboard/crm/tickets',
    icon: Ticket,
  },
  {
    title: 'Productos',
    url: '/dashboard/crm/products',
    icon: Package,
  },
]

const billingMenuItems = [
  {
    title: 'Facturación',
    url: '/billing',
    icon: CreditCard,
  },
  {
    title: 'Comprar Créditos',
    url: '/billing/purchase-credits',
    icon: Wallet,
  },
  {
    title: 'Facturas',
    url: '/billing/invoices',
    icon: Receipt,
  },
  {
    title: 'Uso de Créditos',
    url: '/billing/usage',
    icon: BarChart3,
  },
  {
    title: 'Configuración',
    url: '/billing/settings',
    icon: Settings,
  },
]

const contentMenuItems = [
  {
    title: 'Blog',
    url: '/dashboard/blog',
    icon: BookOpen,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Obtener datos completos del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        
        setUser({
          email: user.email,
          ...userData,
        })
      }
    }

    fetchUser()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (url: string) => {
    if (url === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(url)
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'TP'
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--tp-brand)] text-white font-bold text-sm">
                  TP
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TuPatrimonio</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* CRM */}
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Billing */}
        <SidebarGroup>
          <SidebarGroupLabel>Facturación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {billingMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content */}
        <SidebarGroup>
          <SidebarGroupLabel>Contenido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="rounded-lg bg-[var(--tp-brand)] text-white">
                      {getInitials(user?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.full_name || user?.email || 'Usuario'}
                    </span>
                    <span className="truncate text-xs">Mi Cuenta</span>
                  </div>
                  <ChevronRight className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

