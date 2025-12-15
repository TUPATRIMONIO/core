import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * POST /api/storage/signed-url
 * Genera una signed URL para acceder a archivos en Supabase Storage.
 * Usa service_role para bypasear RLS y valida permisos manualmente.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bucket, path, expiresIn = 3600 } = body

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'bucket y path son requeridos' },
        { status: 400 }
      )
    }

    // 1. Verificar que el usuario está autenticado
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // 2. Extraer org_id del path (formato: {org_id}/{document_id}/...)
    const pathParts = path.split('/')
    const orgIdFromPath = pathParts[0]

    if (!orgIdFromPath) {
      return NextResponse.json(
        { error: 'Path inválido: no se pudo extraer organization_id' },
        { status: 400 }
      )
    }

    // 3. Verificar permisos: usuario es miembro de la org O es platform admin
    const { data: hasAccess } = await supabase.rpc('check_storage_access', {
      p_user_id: user.id,
      p_org_id: orgIdFromPath
    })

    // Si la RPC no existe, fallback a verificación manual
    if (hasAccess === null || hasAccess === undefined) {
      // Verificar si es miembro de la organización
      const { data: orgMember } = await supabase
        .from('organization_users')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', orgIdFromPath)
        .eq('status', 'active')
        .maybeSingle()

      // Verificar si es platform admin
      const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')

      if (!orgMember && !isPlatformAdmin) {
        return NextResponse.json(
          { error: 'No tienes permisos para acceder a este archivo' },
          { status: 403 }
        )
      }
    } else if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a este archivo' },
        { status: 403 }
      )
    }

    // 4. Generar signed URL usando service_role (bypasa RLS)
    const supabaseService = createServiceRoleClient()
    
    // Intentar con el bucket solicitado primero
    const bucketsToTry = Array.isArray(bucket) ? bucket : [bucket]
    
    // Agregar fallbacks comunes
    if (!Array.isArray(bucket)) {
      if (bucket === 'docs-originals') {
        bucketsToTry.push('signing-documents')
      } else if (bucket === 'signing-documents') {
        bucketsToTry.push('docs-originals', 'docs-signed', 'docs-notarized')
      }
    }

    let signedUrl: string | null = null
    let usedBucket: string | null = null
    let lastError: any = null

    for (const b of bucketsToTry) {
      const { data, error } = await supabaseService.storage
        .from(b)
        .createSignedUrl(path, expiresIn)

      if (!error && data?.signedUrl) {
        signedUrl = data.signedUrl
        usedBucket = b
        break
      }
      lastError = error
    }

    if (!signedUrl) {
      console.error('[signed-url] Error generando URL:', lastError)
      return NextResponse.json(
        { error: 'No se pudo generar la URL firmada' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl,
      bucket: usedBucket
    })

  } catch (error: any) {
    console.error('[signed-url] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


