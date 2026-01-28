import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import { NotaryServicesManager } from '@/components/admin/notary-services-manager'

async function getNotaryServicesData(organizationId: string) {
  const supabase = await createClient()

  // 1) Obtener la oficina notarial de la organización
  const { data: notary, error: notaryError } = await supabase
    .from('signing_notary_offices')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (notaryError || !notary) {
    return null
  }

  // 2) Obtener productos (servicios notariales) disponibles para el país de la notaría
  const { data: products } = await supabase
    .from('signing_products')
    .select('id, name, country_code, notary_service, display_order')
    .eq('category', 'notary_service')
    .eq('country_code', notary.country_code)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 3) Obtener configuración actual de servicios de esta notaría
  const { data: notaryServices } = await supabase
    .from('signing_notary_services')
    .select('*')
    .eq('notary_office_id', notary.id)

  // 4) Calcular pesos totales por producto para mostrar proporciones (solo oficinas aprobadas y activas)
  const { data: approvedOffices } = await supabase
    .from('signing_notary_offices')
    .select('id')
    .eq('country_code', notary.country_code)
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .eq('accepts_new_documents', true)

  const officeIds = (approvedOffices || []).map((office) => office.id)
  let totalWeightByProduct: Record<string, number> = {}

  if (officeIds.length > 0) {
    const { data: weights } = await supabase
      .from('signing_notary_services')
      .select('product_id, weight')
      .eq('is_active', true)
      .in('notary_office_id', officeIds)

    totalWeightByProduct = (weights || []).reduce<Record<string, number>>((acc, row: any) => {
      acc[row.product_id] = (acc[row.product_id] || 0) + (row.weight || 0)
      return acc
    }, {})
  }

  return {
    notary,
    products: products || [],
    notaryServices: notaryServices || [],
    totalWeightByProduct,
  }
}

export default async function NotaryServicesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: activeOrg } = await supabase.rpc('get_user_active_organization', {
    user_id: user.id,
  })

  if (!activeOrg || activeOrg.length === 0) {
    redirect('/onboarding')
  }

  const data = await getNotaryServicesData(activeOrg[0].id)

  if (!data) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <PageHeader
        title="Servicios Notariales"
        description="Configura los trámites que tu notaría puede recibir y sus pesos"
      />

      <div className="flex-1 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--tp-buttons)]" />
            <CardTitle>Configuración de servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <NotaryServicesManager
              notaryId={data.notary.id}
              products={data.products}
              notaryServices={data.notaryServices}
              totalWeightByProduct={data.totalWeightByProduct}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
