import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { decryptFromJson } from '@/lib/crypto'

/**
 * Cliente para Gmail API usando OAuth2
 * Requiere configuración de Google Cloud Console con OAuth2 credentials
 */

let oauth2Client: OAuth2Client | null = null

/**
 * Inicializa el cliente OAuth2 de Google
 */
export function initGmailClient(redirectUri?: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados')
  }

  oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/gmail/callback`
  )

  return oauth2Client
}

/**
 * Obtiene el cliente OAuth2 (lo inicializa si no existe)
 * Si se pasa redirectUri, crea una nueva instancia para ese URI
 */
export function getOAuth2Client(redirectUri?: string): OAuth2Client {
  if (redirectUri) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados')
    }
    return new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )
  }

  if (!oauth2Client) {
    return initGmailClient()
  }
  return oauth2Client
}

/**
 * Genera URL de autorización OAuth2
 */
export function getAuthUrl(state?: string, redirectUri?: string): string {
  const client = getOAuth2Client(redirectUri)
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
  ]

  return client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: state || 'default',
  })
}

/**
 * Intercambia código de autorización por tokens
 */
export async function getTokensFromCode(code: string, redirectUri?: string) {
  const client = getOAuth2Client(redirectUri)
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)
  return tokens
}

/**
 * Configura tokens en el cliente OAuth2
 */
export function setCredentials(tokens: any) {
  const client = getOAuth2Client()
  client.setCredentials(tokens)
  return client
}

/**
 * Envía un email usando Gmail API
 */
export async function sendEmail(
  accessToken: string,
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string,
  from?: string
): Promise<{ messageId: string; threadId: string }> {
  const client = getOAuth2Client()
  client.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: 'v1', auth: client })

  // Crear mensaje en formato RFC 2822
  const messageParts = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyHtml,
  ]

  if (from) {
    messageParts.unshift(`From: ${from}`)
  }

  const message = messageParts.join('\n')

  // Codificar en base64url
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  })

  if (!response.data.id || !response.data.threadId) {
    throw new Error('No se pudo obtener el ID del mensaje')
  }

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  }
}

/**
 * Obtiene información de un mensaje de Gmail
 */
export async function getMessage(
  accessToken: string,
  messageId: string
): Promise<any> {
  const client = getOAuth2Client()
  client.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: 'v1', auth: client })

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  })

  return response.data
}

/**
 * Obtiene la cuenta Gmail compartida de una organización
 */
export async function getSharedGmailAccount(organizationId: string) {
  const supabase = createServiceRoleClient()

  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('account_type', 'shared')
    .eq('is_active', true)
    .single()

  if (error || !account) {
    return null
  }

  // Desencriptar tokens
  try {
    const tokensJson = decryptFromJson(account.gmail_oauth_tokens as unknown as string)
    const tokens = JSON.parse(tokensJson)

    return {
      ...account,
      tokens,
    }
  } catch (error) {
    console.error('Error desencriptando tokens Gmail:', error)
    // Si falla la desencriptación, probablemente fue encriptado con una clave diferente
    // (clave temporal vs ENCRYPTION_KEY configurada)
    console.error('⚠️  Los tokens no se pueden desencriptar. Esto puede ocurrir si:')
    console.error('   1. Los tokens fueron encriptados con una clave temporal (sin ENCRYPTION_KEY)')
    console.error('   2. La ENCRYPTION_KEY cambió después de conectar Gmail')
    console.error('   Solución: Configura ENCRYPTION_KEY y reconecta Gmail')
    return null
  }
}

/**
 * Obtiene la firma personal del usuario
 */
export async function getUserSignature(userId: string, organizationId: string) {
  const supabase = createServiceRoleClient()

  const { data: signature, error } = await supabase.rpc('get_user_email_signature', {
    p_user_id: userId,
    p_organization_id: organizationId,
  })

  if (error || !signature || signature.length === 0 || !signature[0].id) {
    return {
      signature_html: '',
      signature_text: '',
    }
  }

  return {
    signature_html: signature[0].signature_html || '',
    signature_text: signature[0].signature_text || '',
  }
}

/**
 * Envía un email usando la cuenta compartida de Gmail con firma personal
 * 
 * @param organizationId - ID de la organización
 * @param userId - ID del usuario que envía (para obtener su firma)
 * @param to - Email destinatario
 * @param subject - Asunto
 * @param bodyHtml - Cuerpo HTML del email
 * @param bodyText - Cuerpo texto plano (opcional, se genera si no se proporciona)
 * @param includeSignature - Si incluir la firma personal (default: true)
 * @param inReplyTo - Message-ID del email al que se está respondiendo (para threading)
 * @param references - Array de Message-IDs de emails anteriores en el thread
 */
export async function sendEmailWithSharedAccount(
  organizationId: string,
  userId: string,
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string,
  includeSignature: boolean = true,
  inReplyTo?: string,
  references?: string[],
  threadId?: string
): Promise<{ messageId: string; threadId: string }> {
  // Obtener cuenta compartida
  const account = await getSharedGmailAccount(organizationId)
  if (!account) {
    throw new Error('No hay cuenta Gmail compartida configurada para esta organización. Ve a Configuración > Gmail para conectar una cuenta.')
  }
  if (!account.tokens) {
    throw new Error('Los tokens de Gmail no se pueden desencriptar. Esto ocurre cuando los tokens fueron encriptados con una clave temporal. Por favor, configura ENCRYPTION_KEY en las variables de entorno y reconecta Gmail desde Configuración > Gmail.')
  }

  // Obtener firma personal si se requiere
  let finalBodyHtml = bodyHtml
  let finalBodyText = bodyText || bodyHtml.replace(/<[^>]*>/g, '')

  if (includeSignature) {
    const signature = await getUserSignature(userId, organizationId)
    if (signature.signature_html) {
      // Agregar separador y firma al HTML
      finalBodyHtml = `${bodyHtml}<br><br>${signature.signature_html}`
    }
    if (signature.signature_text) {
      // Agregar separador y firma al texto
      finalBodyText = `${finalBodyText}\n\n${signature.signature_text}`
    }
  }

  // Usar tokens de la cuenta compartida
  const client = getOAuth2Client()
  
  // Refrescar token si es necesario
  if (account.tokens.expiry_date && account.tokens.expiry_date < Date.now()) {
    // Token expirado, usar refresh token
    client.setCredentials({
      refresh_token: account.tokens.refresh_token,
    })
    const { credentials } = await client.refreshAccessToken()
    account.tokens.access_token = credentials.access_token
    account.tokens.expiry_date = credentials.expiry_date
  }

  client.setCredentials({
    access_token: account.tokens.access_token,
  })

  const gmail = google.gmail({ version: 'v1', auth: client })

  // Crear mensaje en formato RFC 2822 con multipart (HTML + texto)
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Construir headers base
  const headers: string[] = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `From: ${account.gmail_email_address || account.email_address}`,
    `MIME-Version: 1.0`,
  ]

  // Agregar headers de threading si es una respuesta
  if (inReplyTo) {
    // Normalizar: remover <> existentes y agregar uno solo
    const normalizedInReplyTo = inReplyTo.replace(/^<|>$/g, '').trim()
    headers.push(`In-Reply-To: <${normalizedInReplyTo}>`)
  }
  
  if (references && references.length > 0) {
    // El formato de References es una lista separada por espacios
    // Normalizar cada referencia: remover <> existentes y agregar uno solo
    const referencesHeader = references
      .map(ref => {
        const normalized = ref.replace(/^<|>$/g, '').trim()
        return `<${normalized}>`
      })
      .join(' ')
    headers.push(`References: ${referencesHeader}`)
  }

  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`)
  
  const messageParts = [
    ...headers,
    '',
    `--${boundary}`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    finalBodyText,
    '',
    `--${boundary}`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    '',
    finalBodyHtml,
    '',
    `--${boundary}--`,
  ]

  const message = messageParts.join('\n')

  // Codificar en base64url
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  // Construir el request body
  const requestBody: any = {
    raw: encodedMessage,
  }

  // Si hay threadId, incluirlo para que Gmail agrupe automáticamente
  if (threadId) {
    requestBody.threadId = threadId
  }

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody,
  })

  if (!response.data.id || !response.data.threadId) {
    throw new Error('No se pudo obtener el ID del mensaje')
  }

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  }
}
