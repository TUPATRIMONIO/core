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
  Mail,
  Users,
  Send,
  BarChart,
  ShoppingCart,
  FileSignature,
  FilePlus,
  FileEdit,
  FolderOpen,
  Coins,
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
import { getApplicationSlugFromRoute } from '@/config/application-routes'
import { OrganizationSwitcher } from '@/components/organization/OrganizationSwitcher'
import { useOrganization } from '@/hooks/useOrganization'

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
    title: 'Movimientos de Créditos',
    url: '/billing/credits',
    icon: Coins,
  },
  {
    title: 'Pedidos',
    url: '/orders',
    icon: ShoppingCart,
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

const communicationsMenuItems = [
  {
    title: 'Campañas',
    url: '/dashboard/communications/email/campaigns',
    icon: Send,
  },
  {
    title: 'Templates',
    url: '/dashboard/communications/email/templates',
    icon: FileText,
  },
  {
    title: 'Listas',
    url: '/dashboard/communications/lists',
    icon: Users,
  },
  {
    title: 'Analytics',
    url: '/dashboard/communications/analytics',
    icon: BarChart,
  },
  {
    title: 'Configuración SendGrid',
    url: '/dashboard/crm/settings/sendgrid',
    icon: Settings,
  },
]

const signingMenuItems = [
  {
    title: 'Documentos',
    url: '/dashboard/signing/documents',
    icon: FileSignature,
  },
  {
    title: 'Nuevo Documento',
    url: '/dashboard/signing/documents/new',
    icon: FilePlus,
  },
]

const documentsMenuItems = [
  {
    title: 'Mis Documentos',
    url: '/dashboard/documents',
    icon: FolderOpen,
  },
  {
    title: 'Nuevo Documento',
    url: '/dashboard/documents/new',
    icon: FileEdit,
  },
]

const contentMenuItems = [
  {
    title: 'Blog',
    url: '/dashboard/blog',
    icon: BookOpen,
  },
]

const settingsMenuItems = [
  {
    title: 'Organización',
    url: '/settings/organization',
    icon: Building2,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [enabledAppSlugs, setEnabledAppSlugs] = useState<Set<string>>(new Set())
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const { activeOrganization, isLoading: isLoadingOrg } = useOrganization()

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

  useEffect(() => {
    const fetchEnabledApps = async () => {
      // Wait for organization to load
      if (isLoadingOrg || !activeOrganization) {
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoadingApps(false)
        return
      }

      // Obtener aplicaciones habilitadas usando el ID de la organización activa
      const { data: enabledApps, error } = await supabase.rpc('get_enabled_applications', {
        p_organization_id: activeOrganization.id,
        p_user_id: user.id,
      })

      if (error) {
        console.error('Error fetching enabled apps:', error)
        setIsLoadingApps(false)
        return
      }

      // Extraer slugs y agregar siempre visibles
      const slugs = enabledApps?.map((app: any) => app.slug) || []
      const alwaysVisibleSlugs = ['marketing_site'] // marketing_site siempre visible
      
      setEnabledAppSlugs(new Set([...slugs, ...alwaysVisibleSlugs]))
      setIsLoadingApps(false)
    }

    fetchEnabledApps()
  }, [activeOrganization, isLoadingOrg])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (url: string, allItemsInGroup: Array<{ url: string }> = []) => {
    // Para dashboard, solo activo si es exactamente igual
    if (url === '/dashboard') {
      return pathname === '/dashboard'
    }
    
    // Verificar si el pathname coincide exactamente con la URL
    if (pathname === url) {
      return true
    }
    
    // Verificar si el pathname empieza con la URL seguida de /
    if (pathname.startsWith(url + '/')) {
      // Verificar si hay una ruta más específica en el mismo grupo que también coincida
      // Si la hay, esta ruta no debe estar activa
      const moreSpecificMatch = allItemsInGroup.find(item => 
        item.url !== url && 
        pathname.startsWith(item.url) &&
        item.url.length > url.length
      )
      
      // También verificar si hay una ruta más específica en OTROS grupos que coincida
      // Esto evita que /dashboard/crm se active cuando estás en rutas anidadas
      const allOtherGroups = [
        ...communicationsMenuItems,
        ...billingMenuItems,
        ...contentMenuItems,
        ...settingsMenuItems,
        ...mainMenuItems
      ]
      const moreSpecificMatchInOtherGroups = allOtherGroups.find(item => 
        pathname.startsWith(item.url) &&
        item.url.length > url.length &&
        item.url.startsWith(url + '/')
      )
      
      // Solo está activo si no hay una ruta más específica que coincida (ni en el mismo grupo ni en otros)
      return !moreSpecificMatch && !moreSpecificMatchInOtherGroups
    }
    
    return false
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
            <OrganizationSwitcher />
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
                    isActive={isActive(item.url, mainMenuItems)}
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

        {/* CRM - Solo mostrar si la aplicación está habilitada */}
        {!isLoadingApps && enabledAppSlugs.has('crm_sales') && (
          <SidebarGroup>
            <SidebarGroupLabel>CRM</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {crmMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url, crmMenuItems)}
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
        )}

        {/* Firma Electrónica */}
        <SidebarGroup>
          <SidebarGroupLabel>Firma Electrónica</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {signingMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url, signingMenuItems)}
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

        {/* Editor de Documentos */}
        <SidebarGroup>
          <SidebarGroupLabel>Editor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {documentsMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url, documentsMenuItems)}
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
                    isActive={isActive(item.url, billingMenuItems)}
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

        {/* Communications - Solo mostrar si Email Marketing está habilitado */}
        {!isLoadingApps && enabledAppSlugs.has('email_marketing') && (
          <SidebarGroup>
            <SidebarGroupLabel>Comunicaciones</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {communicationsMenuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url, communicationsMenuItems)}
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
        )}

        {/* Content */}
        <SidebarGroup>
          <SidebarGroupLabel>Contenido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url, contentMenuItems)}
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

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url, settingsMenuItems)}
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

