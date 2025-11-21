import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, CreditCard, AlertCircle, TrendingUp, Activity } from 'lucide-react'

async function getMetrics() {
  const supabase = await createClient()

  // Total de organizaciones activas
  const { count: totalOrganizations } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Total de usuarios activos
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Suscripciones activas
  const { count: activeSubscriptions } = await supabase
    .from('organization_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // Suscripciones trial
  const { count: trialSubscriptions } = await supabase
    .from('organization_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'trial')

  // Eventos últimas 24h
  const { count: recentEvents } = await supabase
    .from('system_events')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  // Distribución por tipo de org
  const { data: orgsByType } = await supabase
    .from('organizations')
    .select('org_type')
    .eq('status', 'active')

  const orgDistribution = {
    personal: orgsByType?.filter((o) => o.org_type === 'personal').length || 0,
    business: orgsByType?.filter((o) => o.org_type === 'business').length || 0,
    platform: orgsByType?.filter((o) => o.org_type === 'platform').length || 0,
  }

  return {
    totalOrganizations: totalOrganizations || 0,
    totalUsers: totalUsers || 0,
    activeSubscriptions: activeSubscriptions || 0,
    trialSubscriptions: trialSubscriptions || 0,
    recentEvents: recentEvents || 0,
    orgDistribution,
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getMetrics()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="flex-1 space-y-6 px-4 pb-6">
        {/* Métricas Principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organizaciones Activas
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.orgDistribution.personal} personal • {metrics.orgDistribution.business} business
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de usuarios en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Suscripciones Activas
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.trialSubscriptions} en trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Eventos (24h)
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.recentEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Últimas 24 horas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución de Organizaciones */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Organizaciones</CardTitle>
              <CardDescription>
                Por tipo de organización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm">Personal (B2C)</span>
                </div>
                <span className="text-sm font-medium">{metrics.orgDistribution.personal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Business (B2B)</span>
                </div>
                <span className="text-sm font-medium">{metrics.orgDistribution.business}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-sm">Platform</span>
                </div>
                <span className="text-sm font-medium">{metrics.orgDistribution.platform}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
              <CardDescription>
                Salud general de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Todos los servicios operativos</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Rendimiento óptimo</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">0 incidentes activos</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso directo a tareas comunes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <a
                href="/admin/organizations"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[var(--tp-buttons)] text-white hover:bg-[var(--tp-buttons-hover)] h-10 px-4 py-2"
              >
                Ver Organizaciones
              </a>
              <a
                href="/admin/users"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Gestionar Usuarios
              </a>
              <a
                href="/admin/invitations"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Ver Invitaciones
              </a>
              <a
                href="/admin/events"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                System Events
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

