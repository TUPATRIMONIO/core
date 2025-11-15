/**
 * SMTP Service
 * Envío de emails usando protocolo SMTP (nodemailer)
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  username: string;
  password: string; // App Password o contraseña normal
}

export interface EmailMessage {
  to: string | string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string; // HTML
  bodyText?: string; // Plain text alternative
}

export interface SendResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

/**
 * Crea un transporter de nodemailer
 */
function createTransporter(config: SMTPConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password
    },
    tls: {
      // No fallar con certificados auto-firmados en desarrollo
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

/**
 * Envía un email via SMTP
 */
export async function sendEmailSMTP(
  config: SMTPConfig,
  message: EmailMessage
): Promise<SendResult> {
  try {
    const transporter = createTransporter(config);
    
    const mailOptions = {
      from: config.username,
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      cc: message.cc?.join(', '),
      bcc: message.bcc?.join(', '),
      subject: message.subject,
      html: message.body,
      text: message.bodyText || message.body.replace(/<[^>]*>/g, '') // Strip HTML si no hay texto
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    return {
      messageId: info.messageId,
      accepted: info.accepted as string[],
      rejected: info.rejected as string[]
    };
  } catch (error) {
    console.error('[SMTP] Error sending email:', error);
    throw new Error(`Failed to send email via SMTP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Valida la conexión SMTP antes de guardar
 */
export async function testSMTPConnection(config: SMTPConfig): Promise<boolean> {
  try {
    const transporter = createTransporter(config);
    
    // Verificar conexión
    await transporter.verify();
    
    console.log(`[SMTP] Connection verified for ${config.username}`);
    return true;
  } catch (error) {
    console.error('[SMTP] Connection test failed:', error);
    throw new Error(`SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Envía un email de prueba
 */
export async function sendTestEmail(
  config: SMTPConfig,
  toEmail: string
): Promise<SendResult> {
  return sendEmailSMTP(config, {
    to: toEmail,
    subject: 'Prueba de conexión - TuPatrimonio CRM',
    body: '<p>Este es un email de prueba para verificar que la conexión SMTP funciona correctamente.</p><p>Si recibes este mensaje, la configuración es correcta.</p>',
    bodyText: 'Este es un email de prueba para verificar que la conexión SMTP funciona correctamente. Si recibes este mensaje, la configuración es correcta.'
  });
}

