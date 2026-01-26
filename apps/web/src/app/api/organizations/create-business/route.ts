import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

type BillingData = {
  document_type?: 'boleta_electronica' | 'factura_electronica' | 'stripe_invoice'
  tax_id?: string
  name?: string
  email?: string
  giro?: string
  address?: string
  city?: string
  state?: string
}

type CreateBusinessPayload = {
  name: string
  industry?: string
  size?: string
  country_code: string
  billing_data: BillingData
}

/**
 * POST /api/organizations/create-business
 * Crea una nueva organización empresarial separada y guarda país + datos de facturación
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = (await request.json()) as Partial<CreateBusinessPayload>
    const name = body.name?.trim()
    const industry = body.industry?.trim() || null
    const size = body.size?.trim() || null
    const countryCode = body.country_code?.trim().toUpperCase()
    const billingData = body.billing_data || {}

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre de la empresa es requerido' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'El nombre de la empresa no puede exceder 100 caracteres' },
        { status: 400 }
      )
    }

    if (!countryCode || countryCode.length !== 2) {
      return NextResponse.json(
        { error: 'El país es requerido' },
        { status: 400 }
      )
    }

    const isChile = countryCode === 'CL'
    const documentType = billingData.document_type || (isChile ? 'boleta_electronica' : 'stripe_invoice')
    const taxId = billingData.tax_id?.trim()
    const billingName = billingData.name?.trim()
    const billingEmail = billingData.email?.trim()
    const billingGiro = billingData.giro?.trim()
    const billingAddress = billingData.address?.trim()
    const billingCity = billingData.city?.trim()
    const billingState = billingData.state?.trim()

    if (!billingName) {
      return NextResponse.json(
        { error: 'El nombre o razón social es requerido' },
        { status: 400 }
      )
    }

    if (!billingEmail) {
      return NextResponse.json(
        { error: 'El email de facturación es requerido' },
        { status: 400 }
      )
    }

    if (isChile && !taxId) {
      return NextResponse.json(
        { error: 'El RUT es requerido para Chile' },
        { status: 400 }
      )
    }

    if (documentType === 'factura_electronica') {
      if (!billingGiro) {
        return NextResponse.json(
          { error: 'El giro es requerido para factura electrónica' },
          { status: 400 }
        )
      }
      if (!billingAddress) {
        return NextResponse.json(
          { error: 'La dirección es requerida para factura electrónica' },
          { status: 400 }
        )
      }
      if (!billingCity) {
        return NextResponse.json(
          { error: 'La ciudad es requerida para factura electrónica' },
          { status: 400 }
        )
      }
    }

    const { data: orgId, error: createError } = await supabase.rpc(
      'create_business_organization',
      {
        user_id: user.id,
        user_email: user.email || '',
        org_name: name,
        org_industry: industry,
        org_size: size,
      }
    )

    if (createError || !orgId) {
      console.error('Error creando organización empresarial:', createError)
      let errorMessage = 'Error al crear organización empresarial'
      if (createError?.message?.includes('duplicate key')) {
        errorMessage = 'Ya existe una organización con ese nombre'
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    const serviceSupabase = createServiceRoleClient()
    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    if (orgError) {
      console.error('Error obteniendo settings de organización:', orgError)
      return NextResponse.json(
        { error: 'No se pudieron guardar los datos de facturación' },
        { status: 500 }
      )
    }

    const currentSettings = (org?.settings as Record<string, any>) || {}
    const updatedBillingData: BillingData = {
      document_type: documentType,
      ...(taxId && { tax_id: taxId }),
      name: billingName,
      email: billingEmail,
      ...(billingGiro && { giro: billingGiro }),
      ...(billingAddress && { address: billingAddress }),
      ...(billingCity && { city: billingCity }),
      ...(billingState && { state: billingState }),
    }

    const updatedSettings = {
      ...currentSettings,
      billing_data: updatedBillingData,
    }

    const { error: updateError } = await serviceSupabase
      .from('organizations')
      .update({
        country: countryCode,
        settings: updatedSettings,
      })
      .eq('id', orgId)

    if (updateError) {
      console.error('Error actualizando organización:', updateError)
      return NextResponse.json(
        { error: 'No se pudieron guardar los datos de facturación' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization_id: orgId,
      type: 'business',
      name,
    })
  } catch (error: any) {
    console.error('Error en /api/organizations/create-business:', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
