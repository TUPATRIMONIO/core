/**
 * Gmail OAuth Configuration
 * Setup de OAuth 2.0 para integración con Gmail
 */

import { google } from 'googleapis';
import type { GmailTokens } from './types';

/**
 * Crea cliente OAuth2 de Google
 */
export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/settings/gmail/callback`
  );
}

/**
 * Genera URL de autorización OAuth
 */
export function getGmailAuthUrl(organizationId: string): string {
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
    state: organizationId // Pasar org_id en state para el callback
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



