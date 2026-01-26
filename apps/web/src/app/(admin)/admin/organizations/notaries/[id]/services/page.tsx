import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings } from 'lucide-react'
import { NotaryServicesManager } from '@/components/admin/notary-services-manager'

async function getNotaryServicesData(id: string) {
  const supabase = createServiceRoleClient()

  const { data: notary, error: notaryError } = await supabase
    .from('signing_notary_offices')
    .select('*')
    .eq('id', id)
    .single()

  if (notaryError || !notary) {
    return null
  }

  const { data: products } = await supabase
    .from('signing_products')
    .select('id, name, country_code, notary_service, display_order')
    .eq('category', 'notary_service')
    .eq('country_code', notary.country_code)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  const { data: notaryServices } = await supabase
    .from('signing_notary_services')
    .select('*')
    .eq('notary_office_id', id)

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

export default async function NotaryServicesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getNotaryServicesData(id)

  if (!data) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Servicios de Notaría"
        description={`Gestiona servicios y pesos de ${data.notary.name}`}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/organizations/notaries/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        }
      />

      <div className="flex-1 space-y-6 px-4 pb-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--tp-buttons)]" />
            <CardTitle>Configuración de servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <NotaryServicesManager
              notaryId={id}
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

