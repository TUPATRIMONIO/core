/**
 * Gmail Service
 * Funciones para interactuar con Gmail API
 */

import { google } from 'googleapis';
import { getAuthenticatedClient, refreshAccessToken } from './oauth';
import type { GmailTokens, EmailMessage } from './types';

/**
 * Envía un email usando Gmail API
 */
export async function sendEmail(
  tokens: GmailTokens,
  message: EmailMessage
): Promise<{ id: string; threadId: string }> {
  try {
    // Verificar si el token está expirado y refrescarlo
    let currentTokens = tokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        currentTokens = await refreshAccessToken(tokens.refresh_token);
      } else {
        throw new Error('Token expired and no refresh token available');
      }
    }

    const oauth2Client = getAuthenticatedClient(currentTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construir email
    const emailLines = [];
    
    // Headers
    const toAddresses = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    emailLines.push(`To: ${toAddresses}`);
    
    if (message.cc && message.cc.length > 0) {
      emailLines.push(`Cc: ${message.cc.join(', ')}`);
    }
    
    if (message.bcc && message.bcc.length > 0) {
      emailLines.push(`Bcc: ${message.bcc.join(', ')}`);
    }
    
    emailLines.push(`Subject: ${message.subject}`);
    emailLines.push('Content-Type: text/html; charset=utf-8');
    emailLines.push('');
    emailLines.push(message.body);

    const email = emailLines.join('\n');

    // Codificar en base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Enviar
    const { data } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return {
      id: data.id!,
      threadId: data.threadId!
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email via Gmail');
  }
}

/**
 * Obtiene mensajes recientes del inbox
 */
export async function getRecentMessages(
  tokens: GmailTokens,
  maxResults: number = 50
): Promise<any[]> {
  try {
    let currentTokens = tokens;
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (tokens.refresh_token) {
        currentTokens = await refreshAccessToken(tokens.refresh_token);
      }
    }

    const oauth2Client = getAuthenticatedClient(currentTokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const { data } = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: ['INBOX']
    });

    return data.messages || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch Gmail messages');
  }
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








