'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  Mail,
  Package,
  CreditCard,
  FileText,
  Settings,
  ChevronRight,
  LogOut,
  UserCog,
  Key,
  DollarSign,
  Contact,
  BookOpen,
  Receipt,
  Wallet,
  ShoppingCart,
  UsersRound,
  RefreshCw,
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
import { APPLICATION_ROUTES, getApplicationSlugFromRoute, isAlwaysVisible } from '@/config/application-routes'

const mainMenuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Organizaciones',
    url: '/admin/organizations',
    icon: Building2,
  },
  {
    title: 'Usuarios',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Roles y Permisos',
    url: '/admin/roles',
    icon: Shield,
  },
  {
    title: 'Invitaciones',
    url: '/admin/invitations',
    icon: Mail,
  },
  {
    title: 'Teams',
    url: '/admin/teams',
    icon: UserCog,
  },
  {
    title: 'Pedidos',
    url: '/admin/orders',
    icon: ShoppingCart,
  },
]

const appsMenuItems = [
  {
    title: 'Aplicaciones',
    url: '/admin/applications',
    icon: Package,
  },
  {
    title: 'Suscripciones',
    url: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    title: 'CRM',
    url: '/admin/crm',
    icon: Contact,
  },
  {
    title: 'Blog',
    url: '/admin/blog',
    icon: BookOpen,
  },
]

const billingMenuItems = [
  {
    title: 'Créditos',
    url: '/admin/billing/credits',
    icon: Wallet,
  },
  {
    title: 'Facturas',
    url: '/admin/billing/invoices',
    icon: Receipt,
  },
  {
    title: 'Pagos',
    url: '/admin/billing/payments',
    icon: DollarSign,
  },
  {
    title: 'Reembolsos',
    url: '/admin/refunds',
    icon: RefreshCw,
  },
  {
    title: 'Retiros',
    url: '/admin/billing/withdrawals',
    icon: Wallet,
  },
]



const systemMenuItems = [
  {
    title: 'API Keys',
    url: '/admin/api-keys',
    icon: Key,
  },
  {
    title: 'System Events',
    url: '/admin/events',
    icon: FileText,
  },
  {
    title: 'Configuración',
    url: '/admin/settings',
    icon: Settings,
  },
]

// Items que siempre deben estar visibles (no dependen de aplicaciones)
const ALWAYS_VISIBLE_APP_ITEMS = [
  '/admin/applications',
  '/admin/subscriptions',
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(false)
  const [enabledAppSlugs, setEnabledAppSlugs] = useState<Set<string>>(new Set())
  const [isLoadingApps, setIsLoadingApps] = useState(true)

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

        // Verificar si es platform admin
        const { data: isAdmin } = await supabase.rpc('is_platform_admin')
        setIsPlatformAdmin(isAdmin === true)

        // Si es platform admin, no necesita filtrar aplicaciones
        if (isAdmin === true) {
          setIsLoadingApps(false)
          return
        }
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    // Si es platform admin, no filtrar aplicaciones - mostrar todas siempre
    if (isPlatformAdmin) {
      setIsLoadingApps(false)
      return
    }

    // Solo filtrar si NO es platform admin
    const cacheKey = 'enabled_apps_cache'
    const cacheTimestampKey = 'enabled_apps_cache_timestamp'
    const cacheTTL = 60 * 1000 // 1 minuto

    const fetchEnabledAppsFromAPI = async (): Promise<string[] | null> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return null
      }

      // Obtener organización del usuario
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const organizationId = orgUser?.organization_id || null

      // Obtener aplicaciones habilitadas
      const { data: enabledApps, error } = await supabase.rpc('get_enabled_applications', {
        p_organization_id: organizationId,
        p_user_id: user.id,
      })

      if (error) {
        console.error('Error fetching enabled apps:', error)
        return null
      }

      // Extraer slugs y agregar siempre visibles
      const slugs = enabledApps?.map((app: any) => app.slug) || []
      const alwaysVisibleSlugs = ['marketing_site'] // marketing_site siempre visible

      return [...new Set([...slugs, ...alwaysVisibleSlugs])]
    }

    const fetchEnabledApps = async () => {
      try {
        const cachedData = sessionStorage.getItem(cacheKey)
        const cachedTimestamp = sessionStorage.getItem(cacheTimestampKey)

        if (cachedData && cachedTimestamp) {
          const timestamp = parseInt(cachedTimestamp, 10)
          const now = Date.now()

          if (now - timestamp < cacheTTL) {
            // Cache válido, pero aún así hacer la llamada en background para actualizar
            const slugs = JSON.parse(cachedData)
            setEnabledAppSlugs(new Set(slugs))
            setIsLoadingApps(false)

            // Actualizar en background sin bloquear la UI
            fetchEnabledAppsFromAPI().then((newSlugs) => {
              if (newSlugs) {
                setEnabledAppSlugs(new Set(newSlugs))
                sessionStorage.setItem(cacheKey, JSON.stringify(newSlugs))
                sessionStorage.setItem(cacheTimestampKey, Date.now().toString())
              }
            }).catch(() => {
              // Ignorar errores en background update
            })
            return
          }
        }

        // Cache expirado o no existe, hacer llamada
        const slugs = await fetchEnabledAppsFromAPI()
        if (slugs) {
          setEnabledAppSlugs(new Set(slugs))
          sessionStorage.setItem(cacheKey, JSON.stringify(slugs))
          sessionStorage.setItem(cacheTimestampKey, Date.now().toString())
        }
      } catch (error) {
        console.error('Error in fetchEnabledApps:', error)
      } finally {
        setIsLoadingApps(false)
      }
    }

    fetchEnabledApps()

    // Escuchar eventos de storage para sincronizar entre tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === cacheKey && e.newValue) {
        try {
          const slugs = JSON.parse(e.newValue)
          setEnabledAppSlugs(new Set(slugs))
        } catch (error) {
          console.error('Error parsing storage event:', error)
        }
      }
    }

    // Escuchar evento personalizado cuando se actualiza una aplicación
    const handleApplicationsUpdated = () => {
      // Limpiar cache y recargar
      sessionStorage.removeItem(cacheKey)
      sessionStorage.removeItem(cacheTimestampKey)
      setIsLoadingApps(true)
      fetchEnabledApps()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('applications-updated', handleApplicationsUpdated)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('applications-updated', handleApplicationsUpdated)
    }
  }, [isPlatformAdmin])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (url: string) => {
    if (url === '/admin') {
      return pathname === '/admin'
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

  // Filtrar appsMenuItems según aplicaciones habilitadas
  // Platform admins ven TODAS las aplicaciones siempre (incluso deshabilitadas)
  const filteredAppsMenuItems = appsMenuItems.filter((item) => {
    // Platform admins ven todo siempre
    if (isPlatformAdmin) {
      return true
    }

    // Items siempre visibles siempre se muestran
    if (ALWAYS_VISIBLE_APP_ITEMS.includes(item.url)) {
      return true
    }

    // Obtener slug de la aplicación desde la ruta
    const appSlug = getApplicationSlugFromRoute(item.url)

    // Si no hay mapeo, siempre mostrar (items fijos como Blog que no están en APPLICATION_ROUTES)
    if (!appSlug) {
      return true
    }

    // Si está cargando, ocultar items que requieren verificación (evitar mostrar CRM si está deshabilitado)
    if (isLoadingApps) {
      return false // Ocultar mientras carga para evitar mostrar items que no deberían estar
    }

    // Verificar si la aplicación está habilitada
    return enabledAppSlugs.has(appSlug)
  })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[var(--tp-brand)] text-white font-bold text-sm">
                  TP
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TuPatrimonio</span>
                  <span className="truncate text-xs">Administración</span>
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

        {/* Apps & Services */}
        <SidebarGroup>
          <SidebarGroupLabel>Apps & Servicios</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredAppsMenuItems.map((item) => (
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

        {/* Billing & Credits */}
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



        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemMenuItems.map((item) => (
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
                    <span className="truncate text-xs">Platform Admin</span>
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

