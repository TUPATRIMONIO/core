/**
 * Gmail OAuth Configuration
 * Setup de OAuth 2.0 para integración con Gmail
 */

import { google } from 'googleapis';
import type { GmailTokens } from './types';

/**
 * Crea cliente OAuth2 de Google
 * @param callbackPath - Path del callback (default: /api/crm/email-accounts/callback)
 */
export function getOAuth2Client(callbackPath?: string) {
  const defaultCallback = '/api/crm/email-accounts/callback';
  const callback = callbackPath || defaultCallback;
  
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}${callback}`
  );
}

/**
 * Genera URL de autorización OAuth
 * @param state - Datos a pasar al callback (puede ser string o objeto serializado)
 */
export function getGmailAuthUrl(state: string): string {
  const oauth2Client = getOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // Forzar consent para obtener refresh token
    scope: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose'
    ],
    state: state // Pasar datos en state para el callback
  });
}

/**
 * Obtiene tokens desde el código de autorización
 */
export async function getTokensFromCode(code: string): Promise<GmailTokens> {
  const oauth2Client = getOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  return tokens as GmailTokens;
}

/**
 * Obtiene cliente OAuth configurado con tokens
 */
export function getAuthenticatedClient(tokens: GmailTokens) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
}

/**
 * Refresca el access token si está expirado
 */
export async function refreshAccessToken(refreshToken: string): Promise<GmailTokens> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return credentials as GmailTokens;
}

/**
 * Obtiene el perfil del usuario de Gmail
 */
export async function getGmailProfile(tokens: GmailTokens): Promise<{
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
}> {
  try {
    let currentTokens = tokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        currentTokens = await refreshAccessToken(tokens.refresh_token);
      }
    }

    const oauth2Client = getAuthenticatedClient(currentTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const { data } = await gmail.users.getProfile({
      userId: 'me'
    });

    return {
      emailAddress: data.emailAddress!,
      messagesTotal: data.messagesTotal || 0,
      threadsTotal: data.threadsTotal || 0
    };
  } catch (error) {
    console.error('Error fetching Gmail profile:', error);
    throw new Error('Failed to fetch Gmail profile');
  }
}







