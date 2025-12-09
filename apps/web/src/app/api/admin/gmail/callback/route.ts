import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getTokensFromCode } from '@/lib/gmail/client'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { encryptToJson } from '@/lib/crypto'

/**
 * API Route: Callback OAuth de Gmail
 * 
 * GET /api/admin/gmail/callback?code=xxx&state=xxx
 * 
 * Recibe código de autorización de Google, intercambia por tokens,
 * y guarda en crm.email_accounts como cuenta compartida
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Si hay error de Google
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=missing_params`
      )
    }

    // Decodificar state
    let stateData: { organizationId: string; userId: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=invalid_state`
      )
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=unauthorized`
      )
    }

    // Verificar si es platform admin
    const { data: isPlatformAdmin } = await supabase.rpc('is_platform_admin')
    if (!isPlatformAdmin) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=forbidden`
      )
    }

    // Intercambiar código por tokens
    const tokens = await getTokensFromCode(code)

    // Obtener información del perfil de Gmail para obtener el email
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
    )
    oauth2Client.setCredentials(tokens)

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const profile = await gmail.users.getProfile({ userId: 'me' })

    const gmailEmail = profile.data.emailAddress || 'contacto@tupatrimonio.app'

    console.log('📧 Gmail email obtenido:', gmailEmail)
    console.log('🏢 Organization ID:', stateData.organizationId)

    // Encriptar tokens antes de guardar
    const encryptedTokens = encryptToJson(JSON.stringify(tokens))
    console.log('🔐 Tokens encriptados correctamente')

    // Verificar si ya existe una cuenta compartida para esta organización
    const { data: existingAccount, error: checkError } = await serviceSupabase
      .from('email_accounts')
      .select('id')
      .eq('organization_id', stateData.organizationId)
      .eq('email_address', gmailEmail)
      .eq('account_type', 'shared')
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error verificando cuenta existente:', checkError)
    }

    if (existingAccount) {
      // Actualizar cuenta existente usando función RPC
      const { data: updateResult, error: updateError } = await serviceSupabase.rpc(
        'update_email_account',
        {
          p_account_id: existingAccount.id,
          p_gmail_oauth_tokens: encryptedTokens as any,
          p_gmail_email_address: gmailEmail,
          p_is_active: true,
          p_is_default: true,
          p_connected_at: new Date().toISOString(),
          p_connected_by: user.id,
        }
      )

      if (updateError) {
        console.error('❌ Error actualizando cuenta Gmail:', updateError)
        console.error('Detalles:', JSON.stringify(updateError, null, 2))
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=update_failed&details=${encodeURIComponent(updateError.message || 'unknown')}`
        )
      }
      
      console.log('✅ Cuenta Gmail actualizada exitosamente')
    } else {
      // Crear nueva cuenta compartida usando función RPC
      const { data: accountId, error: insertError } = await serviceSupabase.rpc(
        'insert_email_account',
        {
          p_organization_id: stateData.organizationId,
          p_email_address: gmailEmail,
          p_display_name: 'TuPatrimonio Contacto',
          p_account_type: 'shared',
          p_owner_user_id: null,
          p_gmail_oauth_tokens: encryptedTokens as any,
          p_gmail_email_address: gmailEmail,
          p_connected_by: user.id,
          p_is_active: true,
          p_is_default: true,
        }
      )

      if (insertError) {
        console.error('Error creando cuenta Gmail:', insertError)
        console.error('Detalles del error:', JSON.stringify(insertError, null, 2))
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=create_failed&details=${encodeURIComponent(insertError.message || 'unknown')}`
        )
      }
      
      console.log('✅ Cuenta Gmail creada exitosamente:', {
        organizationId: stateData.organizationId,
        email: gmailEmail,
      })
    }

    // Redirigir a página de configuración con éxito
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?success=connected`
    )
  } catch (error: any) {
    console.error('Error en callback Gmail:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/communications/gmail?error=${encodeURIComponent(error.message || 'unknown_error')}`
    )
  }
}

