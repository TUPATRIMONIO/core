// =====================================================
// Types: Identity Verification
// Description: Tipos para el sistema de verificación de identidad
// =====================================================

export type VerificationPurpose =
  | 'fes_signing'
  | 'fea_signing'
  | 'kyc_onboarding'
  | 'document_notary'
  | 'general';

export type VerificationSessionStatus =
  | 'pending'
  | 'started'
  | 'submitted'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'abandoned'
  | 'resubmission_requested';

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'drivers_license'
  | 'residence_permit'
  | 'other';

export type MediaType =
  | 'face_photo'
  | 'document_front'
  | 'document_back'
  | 'selfie'
  | 'liveness_video';

export interface CreateVerificationSessionParams {
  organizationId: string;
  providerSlug?: string;
  purpose: VerificationPurpose;
  subjectIdentifier: string;
  subjectEmail: string;
  subjectName?: string;
  subjectPhone?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface VerificationSession {
  id: string;
  organization_id: string;
  provider_id: string;
  provider_session_id: string | null;
  purpose: VerificationPurpose;
  subject_identifier: string | null;
  subject_email: string | null;
  subject_name: string | null;
  subject_phone: string | null;
  status: VerificationSessionStatus;
  decision_code: string | null;
  decision_reason: string | null;
  risk_score: number | null;
  verified_at: string | null;
  expires_at: string | null;
  reference_type: string | null;
  reference_id: string | null;
  verification_url: string | null;
  raw_response: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface VerificationDocument {
  id: string;
  session_id: string;
  document_type: DocumentType;
  document_country: string | null;
  document_number: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  expiry_date: string | null;
  is_expired: boolean | null;
  mrz_data: Record<string, any> | null;
  validation_checks: Record<string, any>;
  confidence_score: number | null;
  created_at: string;
}

export interface VerificationMedia {
  id: string;
  session_id: string;
  attempt_id: string | null;
  media_type: MediaType;
  provider_media_id: string | null;
  storage_path: string | null;
  original_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  downloaded_at: string | null;
  checksum: string | null;
  created_at: string;
}

export interface VerificationAttempt {
  id: string;
  session_id: string;
  attempt_number: number;
  provider_attempt_id: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  failure_reason: string | null;
  raw_response: Record<string, any>;
  started_at: string;
  completed_at: string | null;
}

export interface VerificationSessionFull {
  session: VerificationSession;
  provider: {
    id: string;
    name: string;
    slug: string;
  };
  attempts: VerificationAttempt[];
  documents: VerificationDocument[];
  media: VerificationMedia[];
}

export interface CreateVerificationResponse {
  success: boolean;
  sessionId: string;
  verificationUrl: string;
  providerSessionId: string;
}

export interface PreviousVerification {
  session_id: string;
  provider_name: string;
  purpose: VerificationPurpose;
  status: VerificationSessionStatus;
  verified_at: string | null;
  risk_score: number | null;
  created_at: string;
}
