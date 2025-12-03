import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Zap, Globe, Lock, Users, Edit } from 'lucide-react'
import Link from 'next/link'

async function getApplications() {
  const supabase = createServiceRoleClient()

  // Platform admins deben ver TODAS las aplicaciones, incluso las deshabilitadas
  // para poder gestionarlas y habilitarlas nuevamente si es necesario
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      organization_applications(count)
    `)
    .order('is_active', { ascending: false }) // Activas primero
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  // Obtener conteo de overrides por aplicación
  if (applications && applications.length > 0) {
    const appIds = applications.map((app: any) => app.id)
    const { data: overrides } = await supabase
      .from('application_overrides')
      .select('application_id')
      .in('application_id', appIds)

    // Agregar conteo de overrides a cada aplicación
    if (overrides) {
      const overrideCounts = overrides.reduce((acc: any, override: any) => {
        acc[override.application_id] = (acc[override.application_id] || 0) + 1
        return acc
      }, {})

      applications.forEach((app: any) => {
        app.override_count = overrideCounts[app.id] || 0
      })
    }
  }

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  return applications || []
}

const visibilityLabels: Record<string, string> = {
  public: 'Público',
  platform_only: 'Solo Admin',
  beta: 'Beta',
  restricted: 'Restringido',
}

const visibilityColors: Record<string, string> = {
  public: 'bg-green-100 text-green-800 border-green-200',
  platform_only: 'bg-red-100 text-red-800 border-red-200',
  beta: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  restricted: 'bg-gray-100 text-gray-800 border-gray-200',
}

const categoryColors: Record<string, string> = {
  core: 'bg-purple-100 text-purple-800 border-purple-200',
  business: 'bg-green-100 text-green-800 border-green-200',
  ai: 'bg-blue-100 text-blue-800 border-blue-200',
  integration: 'bg-orange-100 text-orange-800 border-orange-200',
  analytics: 'bg-pink-100 text-pink-800 border-pink-200',
}

export default async function ApplicationsPage() {
  const applications = await getApplications()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Aplicaciones"
        description="Catálogo de aplicaciones del ecosistema"
      />

      <div className="flex-1 px-4 pb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app: any) => (
            <Card key={app.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {app.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{app.slug}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    {app.is_active ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Activa
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        Inactiva
                      </Badge>
                    )}
                    {app.is_beta && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Zap className="mr-1 h-3 w-3" />
                        Beta
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {app.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={categoryColors[app.category]}>
                    {app.category}
                  </Badge>
                  {app.visibility_level && (
                    <Badge variant="outline" className={visibilityColors[app.visibility_level]}>
                      {visibilityLabels[app.visibility_level]}
                    </Badge>
                  )}
                  {app.allowed_countries && app.allowed_countries.length > 0 && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Globe className="mr-1 h-3 w-3" />
                      {app.allowed_countries.length} país(es)
                    </Badge>
                  )}
                  {app.required_subscription_tiers && app.required_subscription_tiers.length > 0 && (
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                      <Users className="mr-1 h-3 w-3" />
                      {app.required_subscription_tiers.length} tier(s)
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    {app.organization_applications?.[0]?.count || 0} orgs usando
                    {app.override_count > 0 && (
                      <span className="ml-2">
                        • {app.override_count} override(s)
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    v{app.version}
                  </span>
                </div>

                <Link href={`/admin/applications/${app.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Visibilidad
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

