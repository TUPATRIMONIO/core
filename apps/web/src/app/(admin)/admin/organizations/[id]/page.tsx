import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/admin/status-badge'
import { OrgTypeBadge } from '@/components/admin/org-type-badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

async function getOrganization(id: string) {
  const supabase = await createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select(`
      *,
      organization_users(
        id,
        status,
        joined_at,
        users(
          id,
          full_name,
          email:id
        ),
        roles(
          name,
          slug
        )
      ),
      organization_applications(
        id,
        is_enabled,
        applications(
          name,
          slug
        )
      ),
      organization_subscriptions(
        id,
        status,
        current_period_start,
        current_period_end,
        subscription_plans(
          name,
          slug
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching organization:', error)
    return null
  }

  // Obtener emails de los usuarios
  if (org?.organization_users) {
    const userIds = org.organization_users.map((ou: any) => ou.users.id)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    org.organization_users = org.organization_users.map((ou: any) => ({
      ...ou,
      users: {
        ...ou.users,
        email: authUsers?.users.find((u: any) => u.id === ou.users.id)?.email || 'N/A'
      }
    }))
  }

  return org
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const org = await getOrganization(params.id)

  if (!org) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={org.name}
        description={`Detalles de la organización ${org.slug}`}
        actions={
          <Link href="/admin/organizations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />

      <div className="flex-1 px-4 pb-6 space-y-6">
        {/* Información General */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm mt-1">{org.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <p className="text-sm mt-1">{org.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                <div className="mt-1">
                  <OrgTypeBadge type={org.org_type} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado</label>
                <div className="mt-1">
                  <StatusBadge status={org.status} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm mt-1">{org.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                <p className="text-sm mt-1">{org.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Creada</label>
                <p className="text-sm mt-1">
                  {new Date(org.created_at).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Miembros */}
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({org.organization_users?.length || 0})</CardTitle>
            <CardDescription>Usuarios que pertenecen a esta organización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.organization_users?.map((ou: any) => (
                <div key={ou.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ou.users.full_name || 'Sin nombre'}</p>
                    <p className="text-sm text-muted-foreground">{ou.users.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{ou.roles.name}</span>
                    <StatusBadge status={ou.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aplicaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Aplicaciones Habilitadas</CardTitle>
            <CardDescription>Apps activas para esta organización</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {org.organization_applications?.filter((oa: any) => oa.is_enabled).map((oa: any) => (
                <div key={oa.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{oa.applications.name}</span>
                  <span className="text-sm text-muted-foreground">{oa.applications.slug}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Suscripción */}
        {org.organization_subscriptions && org.organization_subscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suscripción</CardTitle>
            </CardHeader>
            <CardContent>
              {org.organization_subscriptions.map((sub: any) => (
                <div key={sub.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{sub.subscription_plans.name}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-muted-foreground">Inicio</label>
                      <p>{new Date(sub.current_period_start).toLocaleDateString('es-CL')}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground">Fin</label>
                      <p>{new Date(sub.current_period_end).toLocaleDateString('es-CL')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

