/**
 * Types para el sistema CRM
 */

// =====================================================
// ENUMS
// =====================================================

export type ContactStatus = 'lead' | 'qualified' | 'customer' | 'inactive' | 'lost';
export type CompanyType = 'prospect' | 'customer' | 'partner' | 'vendor' | 'competitor' | 'other';
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'sales' | 'general' | 'feature_request' | 'bug_report';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task' | 'whatsapp' | 'system';
export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';

// =====================================================
// INTERFACES
// =====================================================

export interface Contact {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  company_name?: string;
  company_id?: string;
  job_title?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  status: ContactStatus;
  source?: string;
  assigned_to?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  notes?: string;
  last_contacted_at?: string;
  last_activity_at?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relaciones pobladas
  company?: Company;
  assigned_user?: User;
}

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  legal_name?: string;
  domain?: string;
  type: CompanyType;
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  annual_revenue?: number;
  currency?: string;
  parent_company_id?: string;
  assigned_to?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relaciones
  parent_company?: Company;
  assigned_user?: User;
}

export interface Deal {
  id: string;
  organization_id: string;
  contact_id?: string;
  company_id?: string;
  title: string;
  description?: string;
  value?: number;
  currency: string;
  stage: DealStage;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  assigned_to?: string;
  source?: string;
  competitor?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relaciones
  contact?: Contact;
  company?: Company;
  assigned_user?: User;
}

export interface Ticket {
  id: string;
  organization_id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  contact_id?: string;
  company_id?: string;
  related_deal_id?: string;
  assigned_to?: string;
  team_id?: string;
  due_date?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relaciones
  contact?: Contact;
  company?: Company;
  assigned_user?: User;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  tags?: string[];
  price: number;
  currency: string;
  cost?: number;
  billing_type?: 'one_time' | 'recurring' | 'usage_based';
  billing_frequency?: 'monthly' | 'yearly' | 'quarterly';
  is_active: boolean;
  track_inventory?: boolean;
  stock_quantity?: number;
  image_url?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Quote {
  id: string;
  organization_id: string;
  quote_number: string;
  title: string;
  description?: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  status: QuoteStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  currency: string;
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  valid_until?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // Relaciones
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  line_items?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
  sort_order: number;
  created_at: string;
  
  // Relación
  product?: Product;
}

export interface Activity {
  id: string;
  organization_id: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  ticket_id?: string;
  type: ActivityType;
  subject?: string;
  description?: string;
  performed_by?: string;
  performed_at: string;
  duration_minutes?: number;
  outcome?: string;
  email_id?: string;
  calendar_event_id?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  
  // Relaciones
  contact?: Contact;
  company?: Company;
  deal?: Deal;
  ticket?: Ticket;
  performed_by_user?: User;
}

export interface Email {
  id: string;
  organization_id: string;
  contact_id?: string;
  gmail_message_id?: string;
  thread_id?: string;
  from_email: string;
  to_emails: string[];
  cc_emails?: string[];
  bcc_emails?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  direction: 'inbound' | 'outbound';
  status: EmailStatus;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  replied_at?: string;
  attachments?: any[];
  sent_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  contact?: Contact;
}

export interface Pipeline {
  id: string;
  organization_id: string;
  name: string;
  type: 'deals' | 'tickets';
  stages: PipelineStage[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  probability?: number; // Solo para deals
  order: number;
  color: string;
}

export interface CRMSettings {
  id: string;
  organization_id: string;
  gmail_oauth_tokens?: any;
  email_signature?: string;
  auto_reply_enabled: boolean;
  auto_reply_template?: string;
  deal_stages?: any[];
  custom_fields_schema?: Record<string, any>;
  available_tags?: string[];
  notifications?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

// =====================================================
// FILTROS Y QUERIES
// =====================================================

export interface ContactFilters {
  status?: ContactStatus;
  company_id?: string;
  assigned_to?: string;
  search?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
}

export interface CompanyFilters {
  type?: CompanyType;
  industry?: string;
  company_size?: string;
  assigned_to?: string;
  search?: string;
  tags?: string[];
}

export interface DealFilters {
  stage?: DealStage;
  contact_id?: string;
  company_id?: string;
  assigned_to?: string;
  min_value?: number;
  max_value?: number;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  contact_id?: string;
  company_id?: string;
  assigned_to?: string;
}

// =====================================================
// STATS Y ANALYTICS
// =====================================================

export interface CRMStats {
  total_contacts: number;
  total_companies: number;
  new_contacts: number;
  active_deals: number;
  open_tickets: number;
  deals_value: number;
  unread_emails: number;
}

export interface CompanyStats {
  contact_count: number;
  active_deals: number;
  open_tickets: number;
  total_revenue: number;
}



