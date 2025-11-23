import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Zap } from 'lucide-react'

async function getApplications() {
  const supabase = createServiceRoleClient()

  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      organization_applications(count)
    `)
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching applications:', error)
    return []
  }

  return applications || []
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
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant="outline" className={categoryColors[app.category]}>
                    {app.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    v{app.version}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  {app.organization_applications?.[0]?.count || 0} organizaciones usando
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

