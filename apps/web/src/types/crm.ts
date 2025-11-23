// Tipos TypeScript para el CRM de TuPatrimonio

export type ContactStatus = 'lead' | 'qualified' | 'customer' | 'inactive' | 'lost';
export type CompanyType = 'prospect' | 'customer' | 'partner' | 'vendor' | 'competitor' | 'other';
export type DealStage = 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type TicketStatus = 'new' | 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'technical' | 'billing' | 'sales' | 'general' | 'feature_request' | 'bug_report';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
export type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'task' | 'whatsapp' | 'system';
export type EmailStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';

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
  company_id?: string;
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
  currency: string;
  parent_company_id?: string;
  assigned_to?: string;
  linkedin_url?: string;
  twitter_handle?: string;
  custom_fields?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Deal {
  id: string;
  organization_id: string;
  deal_number?: string;
  name: string;
  description?: string;
  stage: DealStage;
  value: number;
  currency: string;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  contact_id?: string;
  company_id?: string;
  assigned_to?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  organization_id: string;
  quote_number: string;
  contact_id?: string;
  company_id?: string;
  deal_id?: string;
  status: QuoteStatus;
  valid_until?: string;
  notes?: string;
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_amount?: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  total: number;
  created_at: string;
}

export interface Activity {
  id: string;
  organization_id: string;
  entity_type: string; // 'contact', 'company', 'deal', 'ticket'
  entity_id: string;
  type: ActivityType;
  title: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  created_at: string;
  created_by?: string;
}

export interface Email {
  id: string;
  organization_id: string;
  thread_id?: string;
  from_email: string;
  from_name?: string;
  to_email: string;
  to_name?: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  body_html?: string;
  status: EmailStatus;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  related_contact_id?: string;
  related_company_id?: string;
  related_deal_id?: string;
  related_ticket_id?: string;
  created_at: string;
  created_by?: string;
}


