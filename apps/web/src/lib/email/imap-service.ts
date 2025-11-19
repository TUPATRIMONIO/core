/**
 * IMAP Service
 * Lectura de emails usando protocolo IMAP
 */

import Imap from 'imap';
import { simpleParser, type ParsedMail } from 'mailparser';
import { Readable } from 'stream';

export interface IMAPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  tls: boolean;
}

export interface ParsedEmail {
  messageId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  bodyHtml: string;
  bodyText: string;
  snippet: string;
  date: Date;
  inReplyTo?: string;
  references: string[];
  hasAttachments: boolean;
  headers: any;
}

/**
 * Crea conexión IMAP
 */
function createIMAPConnection(config: IMAPConfig): Imap {
  return new Imap({
    user: config.username,
    password: config.password,
    host: config.host,
    port: config.port,
    tls: config.tls,
    tlsOptions: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    },
    connTimeout: 10000,
    authTimeout: 10000
  });
}

/**
 * Valida conexión IMAP
 */
export async function testIMAPConnection(config: IMAPConfig): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const imap = createIMAPConnection(config);
    
    imap.once('ready', () => {
      console.log(`[IMAP] Connection verified for ${config.username}`);
      imap.end();
      resolve(true);
    });
    
    imap.once('error', (err: Error) => {
      console.error('[IMAP] Connection test failed:', err);
      reject(new Error(`IMAP connection failed: ${err.message}`));
    });
    
    imap.connect();
  });
}

/**
 * Obtiene emails via IMAP
 */
export async function fetchEmailsIMAP(
  config: IMAPConfig,
  since?: Date,
  limit: number = 100
): Promise<ParsedEmail[]> {
  return new Promise((resolve, reject) => {
    const imap = createIMAPConnection(config);
    const emails: ParsedEmail[] = [];
    
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        
        // Construir criterios de búsqueda
        const searchCriteria: any[] = ['ALL'];
        
        if (since) {
          searchCriteria.push(['SINCE', since]);
        }
        
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }
          
          if (!results || results.length === 0) {
            console.log('[IMAP] No new messages');
            imap.end();
            return resolve([]);
          }
          
          // Limitar cantidad de mensajes
          const messageIds = results.slice(0, limit);
          console.log(`[IMAP] Found ${messageIds.length} messages to fetch`);
          
          const fetch = imap.fetch(messageIds, {
            bodies: '',
            struct: true
          });
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream) => {
              simpleParser(stream as Readable, async (err, parsed) => {
                if (err) {
                  console.error(`[IMAP] Error parsing message ${seqno}:`, err);
                  return;
                }
                
                const email = parseEmailFromIMAP(parsed);
                if (email) {
                  emails.push(email);
                }
              });
            });
          });
          
          fetch.once('error', (err) => {
            console.error('[IMAP] Fetch error:', err);
            imap.end();
            reject(err);
          });
          
          fetch.once('end', () => {
            console.log('[IMAP] Fetch complete');
            imap.end();
          });
        });
      });
    });
    
    imap.once('error', (err: Error) => {
      console.error('[IMAP] Connection error:', err);
      reject(err);
    });
    
    imap.once('end', () => {
      console.log(`[IMAP] Connection ended. Fetched ${emails.length} emails`);
      resolve(emails);
    });
    
    imap.connect();
  });
}

/**
 * Parsea email de mailparser a nuestro formato
 */
function parseEmailFromIMAP(parsed: ParsedMail): ParsedEmail | null {
  try {
    const from = parsed.from?.value?.[0]?.address || '';
    const to = (parsed.to?.value || []).map(addr => addr.address || '').filter(Boolean);
    const cc = (parsed.cc?.value || []).map(addr => addr.address || '').filter(Boolean);
    
    const bodyHtml = parsed.html || parsed.textAsHtml || '';
    const bodyText = parsed.text || '';
    const snippet = (bodyText || parsed.subject || '').substring(0, 200);
    
    return {
      messageId: parsed.messageId || `imap-${Date.now()}`,
      from,
      to,
      cc,
      subject: parsed.subject || '(Sin asunto)',
      bodyHtml,
      bodyText,
      snippet,
      date: parsed.date || new Date(),
      inReplyTo: parsed.inReplyTo,
      references: parsed.references || [],
      hasAttachments: (parsed.attachments?.length || 0) > 0,
      headers: parsed.headers
    };
  } catch (error) {
    console.error('[IMAP] Error parsing email:', error);
    return null;
  }
}

/**
 * Cuenta emails en el inbox
 */
export async function getIMAPEmailCount(config: IMAPConfig): Promise<number> {
  return new Promise((resolve, reject) => {
    const imap = createIMAPConnection(config);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        
        const total = box.messages.total;
        imap.end();
        resolve(total);
      });
    });
    
    imap.once('error', (err: Error) => {
      reject(err);
    });
    
    imap.connect();
  });
}

/**
 * Marca email como leído
 */
export async function markAsRead(
  config: IMAPConfig,
  messageId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = createIMAPConnection(config);
    
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        
        imap.search([['HEADER', 'MESSAGE-ID', messageId]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return reject(err || new Error('Message not found'));
          }
          
          imap.addFlags(results, ['\\Seen'], (err) => {
            imap.end();
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
    
    imap.once('error', reject);
    imap.connect();
  });
}

