/**
 * Types para integración SendGrid
 */

export interface SendGridAccount {
  id: string;
  organization_id: string;
  api_key: string; // Encriptado en BD, desencriptado en memoria
  from_email: string;
  from_name: string;
  is_active: boolean;
  verified_at: string | null;
  last_verified_at: string | null;
  emails_sent_count: number;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface SendGridAccountInput {
  api_key: string; // En texto plano (se encripta antes de guardar)
  from_email: string;
  from_name: string;
}

export interface SendGridMessage {
  to: string | string[];
  from: string;
  fromName?: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  customArgs?: Record<string, string>; // Metadata para identificar organización en webhooks
}

export interface SendGridResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
}

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed' | 'spamreport';
  sg_message_id?: string;
  sg_event_id?: string;
  reason?: string;
  status?: string;
  url?: string;
  useragent?: string;
  ip?: string;
  category?: string[];
  custom_args?: Record<string, string>; // Aquí viene organization_id
}

export interface SendGridWebhookPayload {
  _json: SendGridWebhookEvent[];
}

