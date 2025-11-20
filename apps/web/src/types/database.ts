// Generated types for Supabase database
// These should be regenerated with: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Core schema types
export interface CoreUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  default_currency: string
  country: string
  last_active_organization_id: string | null
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  is_personal: boolean
  settings: Json
  created_at: string
  updated_at: string
}

export interface OrganizationUser {
  id: string
  organization_id: string
  user_id: string
  role_id: string
  status: 'active' | 'inactive' | 'suspended'
  joined_at: string
  invited_by: string | null
  additional_permissions: Json
  created_at: string
  updated_at: string
  // Joined data
  role?: {
    slug: string
    name: string
  }
  organization?: Organization
}

// Legacy type alias for compatibility
export type OrganizationMember = OrganizationUser & {
  role: string | { slug: string; name: string }
}

export interface OrganizationCredits {
  id: string
  organization_id: string
  balance: number
  allow_transfers: boolean
  updated_at: string
}

export interface CreditTransaction {
  id: string
  organization_id: string
  type: 'purchase' | 'spend' | 'refund' | 'bonus' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'subscription'
  amount: number
  balance_after: number
  description: string
  reference_type: string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}

export interface Product {
  id: string
  schema_name: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  metadata: Json
  created_at: string
}

export interface ProductPrice {
  id: string
  product_id: string
  currency_code: string
  price_cents: number
  credit_cost: number
  is_default: boolean
  created_at: string
}

// Signatures schema types
export interface SignatureProvider {
  id: string
  code: string
  name: string
  description: string | null
  is_active: boolean
  config: Json
  created_at: string
}

export interface SignatureDocument {
  id: string
  organization_id: string
  provider_id: string
  external_id: string | null
  title: string
  description: string | null
  file_url: string
  file_hash: string | null
  signed_file_url: string | null
  status: 'draft' | 'pending_signatures' | 'partially_signed' | 'fully_signed' | 'pending_notary' | 'notary_processing' | 'completed' | 'rejected' | 'expired' | 'cancelled'
  signing_mode: 'parallel' | 'sequential'
  expires_at: string | null
  completed_at: string | null
  metadata: Json
  created_by: string
  created_at: string
  updated_at: string
}

export interface DocumentSigner {
  id: string
  document_id: string
  email: string
  name: string
  phone: string | null
  signing_order: number
  role: string
  status: 'pending' | 'notified' | 'viewed' | 'signed' | 'rejected' | 'expired'
  signed_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  signature_ip: string | null
  signature_location: string | null
  metadata: Json
  created_at: string
}

// Notary schema types
export interface NotaryServiceType {
  id: string
  slug: string
  name: string
  description: string | null
  base_price: number
  requires_document: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Notary {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  region: string | null
  is_active: boolean
  portal_user_id: string | null
  metadata: Json
  created_at: string
  updated_at: string
}

export interface NotaryRequest {
  id: string
  organization_id: string
  notary_id: string
  service_type_id: string
  signature_document_id: string | null
  document_url: string | null
  document_title: string | null
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes: string | null
  result_url: string | null
  completed_at: string | null
  metadata: Json
  created_by: string
  created_at: string
  updated_at: string
}

// Permission types
export interface Permission {
  schema: string
  action: string
}

export interface UserPermission {
  id: string
  organization_id: string
  user_id: string
  permissions: Json // JSONB: {"schema_name": ["action1", "action2"]}
  created_at: string
  updated_at: string
  updated_by: string | null
}

// Feature types
export interface Feature {
  id: string
  code: string
  name: string
  description: string | null
  schema_name: string
  is_active: boolean
  created_at: string
}

// Additional types
export interface Role {
  id: string
  name: string
  slug: string
  description: string | null
  level: number
  permissions: Json
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_active: boolean
  sort_order: number
}

export interface CreditPackage {
  id: string
  name: string
  slug: string
  description: string | null
  credits: number
  bonus_credits: number
  is_active: boolean
  is_popular: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreditPackagePrice {
  id: string
  package_id: string
  currency: string
  price: number
}

// API types for hooks
export interface UserWithOrganizations extends CoreUser {
  memberships: (OrganizationUser & {
    organization: Organization
    role: { slug: string; name: string }
  })[]
}

export interface OrganizationWithCredits extends Organization {
  credits: OrganizationCredits | null
  member_count?: number
}
