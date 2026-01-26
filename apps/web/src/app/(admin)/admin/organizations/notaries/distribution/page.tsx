import { createServiceRoleClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/admin/page-header'
import { NotaryDistributionDashboard } from '@/components/admin/notary-distribution-dashboard'

interface DistributionRow {
  notaryId: string
  notaryName: string
  countryCode: string
  productId: string
  productName: string
  weight: number
  proportion: number
  assignedCount: number
}

async function getDistributionData() {
  const supabase = createServiceRoleClient()

  const { data: notaryOffices } = await supabase
    .from('signing_notary_offices')
    .select('id, name, country_code')
    .eq('approval_status', 'approved')
    .eq('is_active', true)
    .eq('accepts_new_documents', true)

  const officeMap = new Map(
    (notaryOffices || []).map((office: any) => [office.id, office])
  )
  const officeIds = Array.from(officeMap.keys())

  const { data: products } = await supabase
    .from('signing_products')
    .select('id, name, country_code')
    .eq('category', 'notary_service')
    .eq('is_active', true)

  const productMap = new Map(
    (products || []).map((product: any) => [product.id, product])
  )

  const { data: notaryServices } = await supabase
    .from('signing_notary_services')
    .select('notary_office_id, product_id, weight, is_active')
    .eq('is_active', true)
    .in('notary_office_id', officeIds.length ? officeIds : ['00000000-0000-0000-0000-000000000000'])

  const totalWeightByProductCountry: Record<string, number> = {}

  ;(notaryServices || []).forEach((service: any) => {
    const product = productMap.get(service.product_id)
    const office = officeMap.get(service.notary_office_id)
    if (!product || !office) return
    const key = `${service.product_id}:${office.country_code}`
    totalWeightByProductCountry[key] = (totalWeightByProductCountry[key] || 0) + (service.weight || 0)
  })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: assignments } = await supabase
    .from('signing_notary_assignments')
    .select('notary_office_id, product_id, assigned_at')
    .gte('assigned_at', thirtyDaysAgo)
    .in('notary_office_id', officeIds.length ? officeIds : ['00000000-0000-0000-0000-000000000000'])

  const assignmentCounts: Record<string, number> = {}
  ;(assignments || []).forEach((assignment: any) => {
    const key = `${assignment.notary_office_id}:${assignment.product_id}`
    assignmentCounts[key] = (assignmentCounts[key] || 0) + 1
  })

  const rows: DistributionRow[] = (notaryServices || []).reduce((acc: DistributionRow[], service: any) => {
    const product = productMap.get(service.product_id)
    const office = officeMap.get(service.notary_office_id)
    if (!product || !office) return acc

    const totalKey = `${service.product_id}:${office.country_code}`
    const totalWeight = totalWeightByProductCountry[totalKey] || 0
    const proportion = totalWeight > 0 ? (service.weight / totalWeight) * 100 : 0
    const assignedKey = `${service.notary_office_id}:${service.product_id}`

    acc.push({
      notaryId: service.notary_office_id,
      notaryName: office.name,
      countryCode: office.country_code,
      productId: service.product_id,
      productName: product.name,
      weight: service.weight,
      proportion,
      assignedCount: assignmentCounts[assignedKey] || 0,
    })
    return acc
  }, [])

  const countryList = Array.from(
    new Map(
      (notaryOffices || []).map((office: any) => [
        office.country_code,
        { id: office.country_code, name: office.country_code },
      ])
    ).values()
  )

  const productList = (products || []).map((product: any) => ({
    id: product.id,
    name: product.name,
  }))

  return {
    rows,
    countries: countryList,
    products: productList,
  }
}

export default async function NotaryDistributionPage() {
  const data = await getDistributionData()

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Distribución Notarial"
        description="Visualiza la proporción de asignaciones por servicio y país"
      />

      <div className="flex-1 space-y-6 px-4 pb-6">
        <NotaryDistributionDashboard
          rows={data.rows}
          products={data.products}
          countries={data.countries}
        />
      </div>
    </div>
  )
}

