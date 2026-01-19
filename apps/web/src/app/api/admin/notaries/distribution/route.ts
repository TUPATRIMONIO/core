import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: isAdmin } = await supabase.rpc('is_platform_admin')
    if (!isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')
    const product = searchParams.get('product')

    const serviceSupabase = createServiceRoleClient()

    const { data: notaryOffices } = await serviceSupabase
      .from('signing_notary_offices')
      .select('id, name, country_code')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .eq('accepts_new_documents', true)
      .match(country ? { country_code: country } : {})

    const officeMap = new Map(
      (notaryOffices || []).map((office: any) => [office.id, office])
    )
    const officeIds = Array.from(officeMap.keys())

    const { data: products } = await serviceSupabase
      .from('signing_products')
      .select('id, name, country_code')
      .eq('category', 'notary_service')
      .eq('is_active', true)
      .match(product ? { id: product } : {})

    const productMap = new Map(
      (products || []).map((product: any) => [product.id, product])
    )

    const { data: notaryServices } = await serviceSupabase
      .from('signing_notary_services')
      .select('notary_office_id, product_id, weight, is_active')
      .eq('is_active', true)
      .in('notary_office_id', officeIds.length ? officeIds : ['00000000-0000-0000-0000-000000000000'])
      .match(product ? { product_id: product } : {})

    const totalWeightByProductCountry: Record<string, number> = {}
    ;(notaryServices || []).forEach((service: any) => {
      const office = officeMap.get(service.notary_office_id)
      const productData = productMap.get(service.product_id)
      if (!office || !productData) return
      const key = `${service.product_id}:${office.country_code}`
      totalWeightByProductCountry[key] = (totalWeightByProductCountry[key] || 0) + (service.weight || 0)
    })

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: assignments } = await serviceSupabase
      .from('signing_notary_assignments')
      .select('notary_office_id, product_id, assigned_at')
      .gte('assigned_at', thirtyDaysAgo)
      .in('notary_office_id', officeIds.length ? officeIds : ['00000000-0000-0000-0000-000000000000'])
      .match(product ? { product_id: product } : {})

    const assignmentCounts: Record<string, number> = {}
    ;(assignments || []).forEach((assignment: any) => {
      const key = `${assignment.notary_office_id}:${assignment.product_id}`
      assignmentCounts[key] = (assignmentCounts[key] || 0) + 1
    })

    const rows = (notaryServices || []).reduce((acc: any[], service: any) => {
      const office = officeMap.get(service.notary_office_id)
      const productData = productMap.get(service.product_id)
      if (!office || !productData) return acc

      const totalKey = `${service.product_id}:${office.country_code}`
      const totalWeight = totalWeightByProductCountry[totalKey] || 0
      const proportion = totalWeight > 0 ? (service.weight / totalWeight) * 100 : 0
      const assignmentKey = `${service.notary_office_id}:${service.product_id}`

      acc.push({
        notaryId: service.notary_office_id,
        notaryName: office.name,
        countryCode: office.country_code,
        productId: service.product_id,
        productName: productData.name,
        weight: service.weight,
        proportion,
        assignedCount: assignmentCounts[assignmentKey] || 0,
      })
      return acc
    }, [])

    return NextResponse.json({ success: true, data: rows })
  } catch (error) {
    console.error('Error en GET /api/admin/notaries/distribution:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
