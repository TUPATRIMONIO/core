/**
 * Cliente SendGrid Multi-Organización
 *
 * Wrapper para @sendgrid/mail que:
 * - Obtiene API key de la organización desde BD
 * - Maneja retry logic con exponential backoff
 * - Implementa rate limiting según plan SendGrid
 * - Tracking de eventos
 */

import sgMail from "@sendgrid/mail";
import { getSenderByPurpose, getSendGridAccount } from "./accounts";
import type { SenderPurpose, SendGridMessage, SendGridResponse } from "./types";

// Rate limiting por organización (emails por segundo)
const RATE_LIMITS = {
  free: 1, // 1 email/segundo
  essentials: 2, // 2 emails/segundo
  pro: 10, // 10 emails/segundo
  premier: 20, // 20 emails/segundo
};

// Configuración de retry
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 segundo

// Cache de rate limiting por organización
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Obtiene el límite de rate para una organización
 * Por defecto usa el plan más bajo (free)
 */
function getRateLimit(organizationId: string): number {
  // TODO: Obtener plan de suscripción de la organización
  // Por ahora usamos el plan más bajo
  return RATE_LIMITS.free;
}

/**
 * Verifica si se puede enviar un email según rate limiting
 */
function checkRateLimit(organizationId: string): boolean {
  const limit = getRateLimit(organizationId);
  const now = Date.now();
  const cacheKey = organizationId;

  const cached = rateLimitCache.get(cacheKey);

  if (!cached || cached.resetAt < now) {
    // Resetear contador
    rateLimitCache.set(cacheKey, {
      count: 1,
      resetAt: now + 1000, // Reset cada segundo
    });
    return true;
  }

  if (cached.count >= limit) {
    return false; // Rate limit alcanzado
  }

  // Incrementar contador
  cached.count++;
  return true;
}

/**
 * Espera hasta que se pueda enviar según rate limiting
 */
async function waitForRateLimit(organizationId: string): Promise<void> {
  while (!checkRateLimit(organizationId)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Retry con exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY,
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Si es error de rate limit (429) o server error (5xx), reintentar
    const shouldRetry = retries > 0 &&
      (error?.response?.statusCode === 429 ||
        error?.response?.statusCode >= 500 ||
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT");

    if (!shouldRetry) {
      throw error;
    }

    // Esperar antes de reintentar (exponential backoff)
    await new Promise((resolve) => setTimeout(resolve, delay));

    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Envía un email usando SendGrid
 *
 * @param organizationId - ID de la organización
 * @param message - Mensaje a enviar
 * @param options - Opciones adicionales (purpose, customArgs)
 * @returns Respuesta de SendGrid
 */
export async function sendEmail(
  organizationId: string,
  message: SendGridMessage,
  options?: {
    purpose?: SenderPurpose;
    customArgs?: Record<string, string>;
  },
): Promise<SendGridResponse> {
  const { purpose = "marketing", customArgs } = options || {};

  // Obtener cuenta SendGrid de la organización
  const account = await getSendGridAccount(organizationId);

  if (!account) {
    throw new Error(
      `No se encontró cuenta SendGrid activa para la organización ${organizationId}. Por favor, configura una cuenta SendGrid primero.`,
    );
  }

  // Configurar API key
  sgMail.setApiKey(account.api_key);

  // Obtener sender identity por propósito
  const sender = await getSenderByPurpose(organizationId, purpose);

  // Determinar from email/name (prioridad: message > sender > account)
  const fromEmail = message.from || sender?.from_email || account.from_email;
  const fromName = message.fromName || sender?.from_name || account.from_name;

  // Esperar rate limiting
  await waitForRateLimit(organizationId);

  // Preparar mensaje con custom args para webhooks
  const msg = {
    to: message.to,
    from: {
      email: fromEmail,
      name: fromName,
    },
    replyTo: sender?.reply_to_email || undefined,
    subject: message.subject,
    html: message.html,
    text: message.text,
    templateId: message.templateId,
    dynamicTemplateData: message.dynamicTemplateData,
    customArgs: {
      organization_id: organizationId,
      purpose,
      ...customArgs,
    },
  };

  // Enviar con retry
  return retryWithBackoff(async () => {
    const [response] = await sgMail.send(msg);

    return {
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers as Record<string, string>,
    };
  });
}

/**
 * Envía múltiples emails en batch
 *
 * @param organizationId - ID de la organización
 * @param messages - Array de mensajes a enviar
 * @param options - Opciones adicionales (purpose, customArgs)
 * @returns Array de respuestas de SendGrid
 */
export async function sendBatchEmails(
  organizationId: string,
  messages: SendGridMessage[],
  options?: {
    purpose?: SenderPurpose;
    customArgs?: Record<string, string>;
  },
): Promise<SendGridResponse[]> {
  const { purpose = "marketing", customArgs } = options || {};

  const account = await getSendGridAccount(organizationId);

  if (!account) {
    throw new Error(
      `No se encontró cuenta SendGrid activa para la organización ${organizationId}`,
    );
  }

  sgMail.setApiKey(account.api_key);

  // Obtener sender identity por propósito
  const sender = await getSenderByPurpose(organizationId, purpose);

  // Determinar from email/name
  const fromEmail = sender?.from_email || account.from_email;
  const fromName = sender?.from_name || account.from_name;

  // Preparar mensajes con custom args
  const preparedMessages = messages.map((message) => ({
    to: message.to,
    from: {
      email: message.from || fromEmail,
      name: message.fromName || fromName,
    },
    replyTo: sender?.reply_to_email || undefined,
    subject: message.subject,
    html: message.html,
    text: message.text,
    templateId: message.templateId,
    dynamicTemplateData: message.dynamicTemplateData,
    customArgs: {
      organization_id: organizationId,
      purpose,
      ...customArgs,
    },
  }));

  // Enviar batch con retry
  return retryWithBackoff(async () => {
    const responses = await sgMail.send(preparedMessages);
    return responses.map((response) => ({
      statusCode: response.statusCode,
      body: response.body,
      headers: response.headers as Record<string, string>,
    }));
  });
}
