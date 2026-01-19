import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { sendNotaryRegistrationNotification } from '@/lib/notifications/notary'

export const runtime = 'nodejs'

/**
 * POST /api/onboarding/notary
 * Crea una organización tipo notaría para el usuario autenticado
 * Body: { name, country_code, city, address, email, phone }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, country_code, city, address, email, phone } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre de la notaría es requerido' },
        { status: 400 }
      )
    }

    if (!country_code || typeof country_code !== 'string' || country_code.trim().length !== 2) {
      return NextResponse.json(
        { error: 'El país es requerido' },
        { status: 400 }
      )
    }

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return NextResponse.json(
        { error: 'La ciudad es requerida' },
        { status: 400 }
      )
    }

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json(
        { error: 'La dirección es requerida' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'El email de contacto es requerido' },
        { status: 400 }
      )
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { error: 'El teléfono es requerido' },
        { status: 400 }
      )
    }

    const { data: orgId, error: createError } = await supabase.rpc(
      'create_notary_organization',
      {
        user_id: user.id,
        user_email: user.email || '',
        org_name: name.trim(),
        notary_country_code: country_code.trim().toUpperCase(),
        notary_city: city.trim(),
        notary_address: address.trim(),
        notary_email: email.trim(),
        notary_phone: phone.trim(),
      }
    )

    if (createError) {
      console.error('Error creando organización notaría:', createError)
      const errorMessage = createError.message.includes('duplicate key')
        ? 'Ya existe una organización con ese nombre'
        : 'Error al crear la notaría'

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'No se pudo crear la notaría' },
        { status: 500 }
      )
    }

    // Enviar notificación al admin de plataforma (best-effort)
    try {
      const serviceSupabase = createServiceRoleClient()
      await sendNotaryRegistrationNotification(serviceSupabase, {
        organizationId: orgId,
        notaryName: name.trim(),
        countryCode: country_code.trim().toUpperCase(),
        city: city.trim(),
        address: address.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        createdByEmail: user.email || '',
      })
    } catch (notifyError) {
      console.error('Error enviando notificación de notaría:', notifyError)
    }

    return NextResponse.json({
      success: true,
      organization_id: orgId,
      type: 'notary',
      name: name.trim(),
      status: 'pending',
    })
  } catch (error) {
    console.error('Error en /api/onboarding/notary:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
