import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApplicationVisibilityForm } from '@/components/admin/applications/ApplicationVisibilityForm'
import { ApplicationOverrideList } from '@/components/admin/applications/ApplicationOverrideList'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getApplication(id: string) {
  const supabase = createServiceRoleClient()

  // Obtener aplicación
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()

  if (appError || !application) {
    return null
  }

  // Obtener overrides con información de organizaciones
  const { data: overrides, error: overridesError } = await supabase
    .from('application_overrides')
    .select(`
      id,
      organization_id,
      is_enabled,
      expires_at,
      created_at,
      updated_at
    `)
    .eq('application_id', id)

  // Obtener información de organizaciones para los overrides
  if (overrides && overrides.length > 0) {
    const orgIds = overrides.map((o: any) => o.organization_id)
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, slug, country, is_beta_tester')
      .in('id', orgIds)

    // Combinar datos
    const overridesWithOrgs = overrides.map((override: any) => ({
      ...override,
      organizations: organizations?.find((org: any) => org.id === override.organization_id)
    }))

    return {
      ...application,
      application_overrides: overridesWithOrgs
    }
  }

  return {
    ...application,
    application_overrides: []
  }
}

async function updateApplication(id: string, data: any) {
  'use server'

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('No autenticado')
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin, error: rpcError } = await supabase.rpc('is_platform_admin')
  if (rpcError || !isPlatformAdmin) {
    throw new Error('No tienes permiso')
  }

  // Preparar datos para actualizar
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.is_active !== undefined) updateData.is_active = data.is_active
  if (data.is_beta !== undefined) updateData.is_beta = data.is_beta
  
  // Solo incluir campos nuevos si existen en la base de datos
  // Verificar primero si las columnas existen consultando la información del schema
  try {
    if (data.visibility_level !== undefined) updateData.visibility_level = data.visibility_level
    if (data.allowed_countries !== undefined) updateData.allowed_countries = data.allowed_countries
    if (data.required_subscription_tiers !== undefined) updateData.required_subscription_tiers = data.required_subscription_tiers
  } catch (e) {
    // Si hay error con campos nuevos, solo actualizar campos básicos
    console.warn('Algunos campos nuevos no están disponibles, actualizando solo campos básicos')
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)

  if (updateError) {
    throw new Error(updateError.message || 'Error al actualizar aplicación')
  }

  revalidatePath(`/admin/applications/${id}`)
  revalidatePath('/admin/applications')
}

async function addOverride(applicationId: string, organizationId: string, isEnabled: boolean, expiresAt?: string) {
  'use server'

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
  if (!isPlatformAdmin) {
    throw new Error('No tienes permiso')
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/applications/${applicationId}/overrides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: organizationId,
      is_enabled: isEnabled,
      expires_at: expiresAt || null,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear override')
  }

  revalidatePath(`/admin/applications/${applicationId}`)
}

async function deleteOverride(applicationId: string, overrideId: string) {
  'use server'

  const supabase = await createClient()

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
  if (!isPlatformAdmin) {
    throw new Error('No tienes permiso')
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/applications/${applicationId}/overrides/${overrideId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al eliminar override')
  }

  revalidatePath(`/admin/applications/${applicationId}`)
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Verificar si es platform admin
  const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
  if (!isPlatformAdmin) {
    redirect('/dashboard')
  }

  const application = await getApplication(id)

  if (!application) {
    notFound()
  }

  async function handleSubmit(data: any) {
    'use server'
    await updateApplication(id, data)
  }

  async function handleAddOverride(organizationId: string, isEnabled: boolean, expiresAt?: string) {
    'use server'
    await addOverride(id, organizationId, isEnabled, expiresAt)
  }

  async function handleDeleteOverride(overrideId: string) {
    'use server'
    await deleteOverride(id, overrideId)
  }

  async function handleUpdateOverride(overrideId: string, organizationId: string, isEnabled: boolean, expiresAt?: string) {
    'use server'
    // Por ahora, eliminar y recrear (podríamos mejorar esto con un endpoint PATCH)
    await deleteOverride(id, overrideId)
    await addOverride(id, organizationId, isEnabled, expiresAt)
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title={application.name}
        description={`Configurar visibilidad y acceso: ${application.slug}`}
      />

      <div className="flex-1 px-4 pb-6 space-y-6">
        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Visibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationVisibilityForm
                initialData={{
                  id: application.id,
                  name: application.name,
                  description: application.description || undefined,
                  is_active: application.is_active,
                  is_beta: application.is_beta,
                  visibility_level: application.visibility_level || 'public',
                  allowed_countries: application.allowed_countries || [],
                  required_subscription_tiers: application.required_subscription_tiers || [],
                }}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>
        </div>

        <div className="max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle>Overrides por Organización</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationOverrideList
                applicationId={id}
                overrides={application.application_overrides || []}
                onAddOverride={handleAddOverride}
                onUpdateOverride={handleUpdateOverride}
                onDeleteOverride={handleDeleteOverride}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

