import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Users, Mail, Phone, Globe, Plus } from 'lucide-react'
import Link from 'next/link'
import { ConvertToBusinessCard } from '@/components/organization/ConvertToBusinessCard'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'

export default async function OrganizationSettingsPage() {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Usar la función RPC para obtener la organización activa (respeta last_active_organization_id)
  const { data: activeOrg, error: activeOrgError } = await supabase.rpc(
    'get_user_active_organization',
    {
      user_id: user.id,
    }
  )

  // Log para debugging
  if (activeOrgError) {
    console.error('Error obteniendo organización activa:', activeOrgError)
  }

  // Si no tiene organización activa, redirigir a onboarding
  if (!activeOrg || activeOrg.length === 0) {
    redirect('/onboarding')
  }

  const activeOrgData = activeOrg[0]

  // Obtener información completa de la organización activa
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', activeOrgData.organization_id)
    .single()

  if (!org) {
    redirect('/onboarding')
  }

  // Obtener el rol del usuario en esta organización
  const { data: orgUser } = await supabase
    .from('organization_users')
    .select(`
      organization_id,
      role:roles(slug, name)
    `)
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .single()

  if (!org) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Error al cargar la información de la organización.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Obtener información del CRM si está habilitado
  const { data: crmApp } = await supabase
    .from('organization_applications')
    .select('config')
    .eq('organization_id', org.id)
    .eq('application_id', (await supabase.from('applications').select('id').eq('slug', 'crm_sales').single()).data?.id)
    .single()

  const crmConfig = crmApp?.config as any
  const maxContacts = crmConfig?.max_contacts || 0
  const maxUsers = crmConfig?.max_users || 0
  const apiAccess = crmConfig?.api_access || false

  // Determinar el tipo de organización para el badge
  const getOrgTypeLabel = (type: string) => {
    switch (type) {
      case 'personal':
        return 'Personal (B2C)'
      case 'business':
        return 'Empresarial (B2B)'
      case 'notary':
        return 'Notaría'
      case 'platform':
        return 'Plataforma'
      default:
        return type
    }
  }

  const getOrgTypeColor = (type: string) => {
    switch (type) {
      case 'personal':
        return 'bg-blue-100 text-blue-800'
      case 'business':
        return 'bg-purple-100 text-purple-800'
      case 'notary':
        return 'bg-amber-100 text-amber-800'
      case 'platform':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configuración de Organización</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona la información y configuración de tu organización
            </p>
          </div>
        </div>
        <Button asChild className="bg-[var(--tp-buttons)] hover:bg-[var(--tp-buttons-hover)] text-white">
          <Link href="/onboarding?new=true">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Organización
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de la Organización */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--tp-buttons)]" />
                <CardTitle>Información de la Organización</CardTitle>
              </div>
              <Badge className={getOrgTypeColor(org.org_type)}>
                {getOrgTypeLabel(org.org_type)}
              </Badge>
            </div>
            <CardDescription>
              Detalles básicos de tu organización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Nombre:</span>
                <span className="text-muted-foreground">{org.name}</span>
              </div>
              {org.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="text-muted-foreground">{org.email}</span>
                </div>
              )}
              {org.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Teléfono:</span>
                  <span className="text-muted-foreground">{org.phone}</span>
                </div>
              )}
              {org.country && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">País:</span>
                  <span className="text-muted-foreground">{org.country}</span>
                </div>
              )}
              {org.industry && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Industria:</span>
                  <span className="text-muted-foreground">{org.industry}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Tu rol:</span>
                <span className="text-muted-foreground">
                  {(orgUser.role as any)?.name || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Límites y Características */}
        <Card>
          <CardHeader>
            <CardTitle>Límites y Características</CardTitle>
            <CardDescription>
              Capacidades actuales de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {crmConfig ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Contactos máximos</span>
                  <span className="text-sm font-bold text-[var(--tp-buttons)]">
                    {maxContacts === -1 ? 'Ilimitado' : maxContacts.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Usuarios máximos</span>
                  <span className="text-sm font-bold text-[var(--tp-buttons)]">
                    {maxUsers === -1 ? 'Ilimitado' : maxUsers}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Acceso a API</span>
                  <Badge variant={apiAccess ? 'default' : 'secondary'}>
                    {apiAccess ? 'Habilitado' : 'Deshabilitado'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Integración de Email</span>
                  <Badge variant={crmConfig.email_integration ? 'default' : 'secondary'}>
                    {crmConfig.email_integration ? 'Habilitada' : 'Deshabilitada'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay información de límites disponible.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Crear nueva organización empresarial - Solo mostrar para cuentas personales */}
        {org.org_type === 'personal' && (
          <div className="lg:col-span-2">
            <ConvertToBusinessCard 
              organizationType={org.org_type}
              organizationName={org.name}
            />
          </div>
        )}
      </div>
    </div>
  )
}


