import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener organización
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
    
    if (!orgUser) {
        return NextResponse.json(
            { error: "Usuario no pertenece a ninguna organización activa" },
            { status: 403 }
        );
    }
    const organizationId = orgUser.organization_id;

    // Obtener firma usando función RPC
    const { data: signature, error } = await supabase.rpc('get_user_email_signature', {
      p_user_id: user.id,
      p_organization_id: organizationId,
    })

    if (error) {
      console.error('Error obteniendo firma:', error)
      return NextResponse.json(
        { error: 'Error al obtener la firma' },
        { status: 500 }
      )
    }

    // Si no hay firma, retornar valores por defecto
    if (!signature || signature.length === 0 || !signature[0].id) {
      return NextResponse.json({
        signature_html: '',
        signature_text: '',
        is_default: true,
      })
    }

    return NextResponse.json({
      id: signature[0].id,
      signature_html: signature[0].signature_html || '',
      signature_text: signature[0].signature_text || '',
      is_default: signature[0].is_default || true,
    })
  } catch (error: any) {
    console.error('Error en GET /api/crm/gmail/signature:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { signature_html, signature_text, is_default = true } = body

    if (!signature_html && !signature_text) {
      return NextResponse.json(
        { error: 'signature_html o signature_text es requerido' },
        { status: 400 }
      )
    }

    // Obtener organización
    const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
    
    if (!orgUser) {
        return NextResponse.json(
            { error: "Usuario no pertenece a ninguna organización activa" },
            { status: 403 }
        );
    }
    const organizationId = orgUser.organization_id;

    // Guardar/actualizar firma usando función RPC
    const { data: signatureId, error } = await supabase.rpc('upsert_user_email_signature', {
      p_user_id: user.id,
      p_organization_id: organizationId,
      p_signature_html: signature_html || '',
      p_signature_text: signature_text || signature_html?.replace(/<[^>]*>/g, '') || '',
      p_is_default: is_default,
    })

    if (error) {
      console.error('Error guardando firma:', error)
      return NextResponse.json(
        { error: 'Error al guardar la firma' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: signatureId,
      message: 'Firma guardada exitosamente',
    })
  } catch (error: any) {
    console.error('Error en POST /api/crm/gmail/signature:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT es igual que POST
export async function PUT(request: NextRequest) {
  return POST(request)
}
