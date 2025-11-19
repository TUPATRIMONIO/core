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

    // Construir email con adjuntos
    let email: string;
    
    if (message.attachments && message.attachments.length > 0) {
      // Email con adjuntos (multipart)
      const boundary = `boundary_${Date.now()}`;
      const emailLines = [];
      
      // Headers principales
      const toAddresses = Array.isArray(message.to) ? message.to.join(', ') : message.to;
      emailLines.push(`To: ${toAddresses}`);
      
      if (message.cc && message.cc.length > 0) {
        emailLines.push(`Cc: ${message.cc.join(', ')}`);
      }
      
      if (message.bcc && message.bcc.length > 0) {
        emailLines.push(`Bcc: ${message.bcc.join(', ')}`);
      }
      
      emailLines.push(`Subject: ${message.subject}`);
      emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
      emailLines.push('');
      
      // Contenido del email
      emailLines.push(`--${boundary}`);
      emailLines.push('Content-Type: text/html; charset=utf-8');
      emailLines.push('');
      emailLines.push(message.body);
      emailLines.push('');
      
      // Adjuntos
      for (const attachment of message.attachments) {
        emailLines.push(`--${boundary}`);
        emailLines.push(`Content-Type: ${attachment.contentType}; name="${attachment.filename}"`);
        emailLines.push('Content-Transfer-Encoding: base64');
        emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
        emailLines.push('');
        // Gmail requiere que el base64 esté en líneas de máximo 76 caracteres
        const base64Lines = attachment.content.match(/.{1,76}/g) || [];
        emailLines.push(base64Lines.join('\n'));
        emailLines.push('');
      }
      
      emailLines.push(`--${boundary}--`);
      email = emailLines.join('\n');
    } else {
      // Email simple sin adjuntos
      const emailLines = [];
      
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
      
      email = emailLines.join('\n');
    }

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








