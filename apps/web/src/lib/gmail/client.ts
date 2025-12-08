import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Cliente para Gmail API usando OAuth2
 * Requiere configuración de Google Cloud Console con OAuth2 credentials
 */

let oauth2Client: OAuth2Client | null = null

/**
 * Inicializa el cliente OAuth2 de Google
 */
export function initGmailClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET deben estar configurados')
  }

  oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/oauth/callback`
  )

  return oauth2Client
}

/**
 * Obtiene el cliente OAuth2 (lo inicializa si no existe)
 */
export function getOAuth2Client(): OAuth2Client {
  if (!oauth2Client) {
    return initGmailClient()
  }
  return oauth2Client
}

/**
 * Genera URL de autorización OAuth2
 */
export function getAuthUrl(state?: string): string {
  const client = getOAuth2Client()
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
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
export async function getTokensFromCode(code: string) {
  const client = getOAuth2Client()
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

