-- =====================================================
-- Migration: Create identity_verifications schema
-- Description: Sistema de verificación de identidad independiente del proveedor
--              Repositorio centralizado para auditorías judiciales e internas
-- Created: 2026-02-04
-- =====================================================

-- Crear el schema
CREATE SCHEMA IF NOT EXISTS identity_verifications;

-- Set search path
SET search_path TO identity_verifications, core, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

-- Propósito de la verificación
CREATE TYPE identity_verifications.verification_purpose AS ENUM (
  'fes_signing',        -- Firma Electrónica Simple con biometría
  'fea_signing',        -- Firma Electrónica Avanzada
  'kyc_onboarding',     -- Onboarding de usuario
  'document_notary',    -- Servicios notariales
  'general'             -- Propósito general
);

-- Estado de sesión de verificación
CREATE TYPE identity_verifications.session_status AS ENUM (
  'pending',                  -- Pendiente de iniciar
  'started',                  -- Usuario inició el proceso
  'submitted',                -- Usuario completó y envió
  'approved',                 -- Verificación aprobada
  'declined',                 -- Verificación rechazada
  'expired',                  -- Sesión expiró
  'abandoned',                -- Usuario abandonó el proceso
  'resubmission_requested'    -- Se requiere reenvío
);

-- Estado de intento de verificación
CREATE TYPE identity_verifications.attempt_status AS ENUM (
  'pending',        -- Pendiente
  'in_progress',    -- En progreso
  'completed',      -- Completado
  'failed'          -- Fallido
);

-- Tipo de documento de identidad
CREATE TYPE identity_verifications.document_type AS ENUM (
  'national_id',        -- Cédula nacional
  'passport',           -- Pasaporte
  'drivers_license',    -- Licencia de conducir
  'residence_permit',   -- Permiso de residencia
  'other'               -- Otro tipo
);

-- Tipo de archivo multimedia
CREATE TYPE identity_verifications.media_type AS ENUM (
  'face_photo',         -- Foto del rostro
  'document_front',     -- Documento frontal
  'document_back',      -- Documento reverso
  'selfie',             -- Selfie
  'liveness_video'      -- Video de liveness
);

-- Tipo de proveedor
CREATE TYPE identity_verifications.provider_type AS ENUM (
  'biometric',      -- Solo biometría
  'document',       -- Solo documentos
  'liveness',       -- Solo liveness check
  'combined'        -- Combinado
);

-- Tipo de actor en audit log
CREATE TYPE identity_verifications.actor_type AS ENUM (
  'system',     -- Sistema automático
  'webhook',    -- Webhook de proveedor
  'user',       -- Usuario final
  'admin'       -- Administrador
);

-- =====================================================
-- PROVIDERS (Proveedores de verificación)
-- =====================================================

CREATE TABLE identity_verifications.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del proveedor
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  description TEXT,
  
  -- Tipo de servicio
  provider_type identity_verifications.provider_type NOT NULL,
  
  -- Configuración de API
  base_url TEXT NOT NULL,
  test_url TEXT, -- URL para ambiente de pruebas
  
  -- Endpoints disponibles (JSONB para flexibilidad)
  endpoints JSONB NOT NULL DEFAULT '{}',
  
  -- Documentación
  documentation_url TEXT,
  
  -- Países soportados
  supported_countries TEXT[] DEFAULT ARRAY['CL'],
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_providers_slug ON identity_verifications.providers(slug);
CREATE INDEX idx_providers_active ON identity_verifications.providers(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_providers_default ON identity_verifications.providers(is_default) WHERE is_default = true;

-- =====================================================
-- PROVIDER CONFIGS (Configuración por organización)
-- =====================================================

CREATE TABLE identity_verifications.provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES identity_verifications.providers(id) ON DELETE CASCADE,
  
  -- Credenciales (encriptadas idealmente)
  credentials JSONB NOT NULL DEFAULT '{}', -- api_key, api_secret, etc.
  
  -- Configuración específica
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Webhook URL para recibir notificaciones del proveedor
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_test_mode BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint único
  CONSTRAINT unique_org_provider UNIQUE (organization_id, provider_id)
);

-- Índices
CREATE INDEX idx_provider_configs_org ON identity_verifications.provider_configs(organization_id);
CREATE INDEX idx_provider_configs_provider ON identity_verifications.provider_configs(provider_id);
CREATE INDEX idx_provider_configs_active ON identity_verifications.provider_configs(is_active) WHERE is_active = true;

-- =====================================================
-- VERIFICATION SESSIONS (Sesión principal)
-- =====================================================

CREATE TABLE identity_verifications.verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Proveedor
  provider_id UUID NOT NULL REFERENCES identity_verifications.providers(id),
  provider_config_id UUID REFERENCES identity_verifications.provider_configs(id),
  provider_session_id TEXT, -- ID de la sesión en el proveedor (Veriff, etc.)
  
  -- Propósito de la verificación
  purpose identity_verifications.verification_purpose NOT NULL,
  
  -- Información del sujeto
  subject_identifier TEXT, -- RUT/DNI/Pasaporte
  subject_email TEXT CHECK (subject_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  subject_name TEXT,
  subject_phone TEXT,
  
  -- Estado
  status identity_verifications.session_status NOT NULL DEFAULT 'pending',
  
  -- Decisión del proveedor
  decision_code TEXT,
  decision_reason TEXT,
  risk_score DECIMAL(5,2), -- 0.00 a 100.00
  
  -- Fechas importantes
  verified_at TIMESTAMPTZ, -- Cuando se aprobó
  expires_at TIMESTAMPTZ, -- Expiración de la sesión
  
  -- Referencia a la entidad que originó esta verificación
  reference_type TEXT, -- 'signing_document', 'user_registration', etc.
  reference_id UUID, -- ID de la entidad origen
  
  -- URL de verificación para el usuario
  verification_url TEXT,
  
  -- Respuesta completa del proveedor (para auditoría)
  raw_response JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata adicional
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
);

-- Índices
CREATE INDEX idx_sessions_org ON identity_verifications.verification_sessions(organization_id);
CREATE INDEX idx_sessions_provider ON identity_verifications.verification_sessions(provider_id);
CREATE INDEX idx_sessions_status ON identity_verifications.verification_sessions(status);
CREATE INDEX idx_sessions_purpose ON identity_verifications.verification_sessions(purpose);
CREATE INDEX idx_sessions_subject_id ON identity_verifications.verification_sessions(subject_identifier) WHERE subject_identifier IS NOT NULL;
CREATE INDEX idx_sessions_subject_email ON identity_verifications.verification_sessions(subject_email) WHERE subject_email IS NOT NULL;
CREATE INDEX idx_sessions_provider_session ON identity_verifications.verification_sessions(provider_session_id) WHERE provider_session_id IS NOT NULL;
CREATE INDEX idx_sessions_reference ON identity_verifications.verification_sessions(reference_type, reference_id) WHERE reference_type IS NOT NULL;
CREATE INDEX idx_sessions_created ON identity_verifications.verification_sessions(created_at DESC);

-- =====================================================
-- VERIFICATION ATTEMPTS (Intentos dentro de una sesión)
-- =====================================================

CREATE TABLE identity_verifications.verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES identity_verifications.verification_sessions(id) ON DELETE CASCADE,
  
  -- Número de intento
  attempt_number INTEGER NOT NULL,
  
  -- ID del intento en el proveedor
  provider_attempt_id TEXT,
  
  -- Estado
  status identity_verifications.attempt_status NOT NULL DEFAULT 'pending',
  
  -- Razón de fallo si aplica
  failure_reason TEXT,
  
  -- Respuesta del proveedor para este intento
  raw_response JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraint único por sesión y número de intento
  CONSTRAINT unique_session_attempt_number UNIQUE (session_id, attempt_number)
);

-- Índices
CREATE INDEX idx_attempts_session ON identity_verifications.verification_attempts(session_id);
CREATE INDEX idx_attempts_status ON identity_verifications.verification_attempts(status);
CREATE INDEX idx_attempts_provider ON identity_verifications.verification_attempts(provider_attempt_id) WHERE provider_attempt_id IS NOT NULL;

-- =====================================================
-- VERIFICATION DOCUMENTS (Documentos capturados)
-- =====================================================

CREATE TABLE identity_verifications.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES identity_verifications.verification_sessions(id) ON DELETE CASCADE,
  
  -- Tipo de documento
  document_type identity_verifications.document_type NOT NULL,
  
  -- País emisor
  document_country TEXT, -- ISO 3166-1 alpha-2
  
  -- Datos extraídos del documento
  document_number TEXT,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  expiry_date DATE,
  is_expired BOOLEAN,
  
  -- Datos MRZ si aplica (pasaportes)
  mrz_data JSONB,
  
  -- Validaciones realizadas por el proveedor
  validation_checks JSONB NOT NULL DEFAULT '{}',
  
  -- Nivel de confianza en la extracción
  confidence_score DECIMAL(5,4), -- 0.0000 a 1.0000
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_documents_session ON identity_verifications.verification_documents(session_id);
CREATE INDEX idx_documents_type ON identity_verifications.verification_documents(document_type);
CREATE INDEX idx_documents_number ON identity_verifications.verification_documents(document_number) WHERE document_number IS NOT NULL;

-- =====================================================
-- VERIFICATION MEDIA (Archivos multimedia)
-- =====================================================

CREATE TABLE identity_verifications.verification_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES identity_verifications.verification_sessions(id) ON DELETE CASCADE,
  attempt_id UUID REFERENCES identity_verifications.verification_attempts(id) ON DELETE SET NULL,
  
  -- Tipo de archivo
  media_type identity_verifications.media_type NOT NULL,
  
  -- Referencia al proveedor
  provider_media_id TEXT, -- ID del archivo en el proveedor
  
  -- Almacenamiento en Supabase
  storage_path TEXT, -- Path en el bucket identity-verifications
  
  -- URL temporal del proveedor (antes de descargar)
  original_url TEXT,
  
  -- Información del archivo
  file_size BIGINT, -- Tamaño en bytes
  mime_type TEXT, -- 'image/jpeg', 'video/mp4', etc.
  
  -- Integridad
  checksum TEXT, -- SHA-256 hash
  
  -- Timestamps
  downloaded_at TIMESTAMPTZ, -- Cuando se descargó del proveedor
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_media_session ON identity_verifications.verification_media(session_id);
CREATE INDEX idx_media_attempt ON identity_verifications.verification_media(attempt_id) WHERE attempt_id IS NOT NULL;
CREATE INDEX idx_media_type ON identity_verifications.verification_media(media_type);
CREATE INDEX idx_media_provider ON identity_verifications.verification_media(provider_media_id) WHERE provider_media_id IS NOT NULL;

-- =====================================================
-- AUDIT LOG (Log inmutable para auditorías)
-- =====================================================

CREATE TABLE identity_verifications.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES identity_verifications.verification_sessions(id) ON DELETE SET NULL,
  
  -- Tipo de evento
  event_type TEXT NOT NULL,
  
  -- Datos del evento
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Información del actor
  actor_type identity_verifications.actor_type NOT NULL,
  actor_id UUID, -- ID del usuario si es tipo 'user' o 'admin'
  
  -- Información de red
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp inmutable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_session ON identity_verifications.audit_log(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_audit_event_type ON identity_verifications.audit_log(event_type);
CREATE INDEX idx_audit_actor ON identity_verifications.audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_created ON identity_verifications.audit_log(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION identity_verifications.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_providers_updated_at 
  BEFORE UPDATE ON identity_verifications.providers 
  FOR EACH ROW EXECUTE FUNCTION identity_verifications.update_updated_at();

CREATE TRIGGER update_provider_configs_updated_at 
  BEFORE UPDATE ON identity_verifications.provider_configs 
  FOR EACH ROW EXECUTE FUNCTION identity_verifications.update_updated_at();

CREATE TRIGGER update_sessions_updated_at 
  BEFORE UPDATE ON identity_verifications.verification_sessions 
  FOR EACH ROW EXECUTE FUNCTION identity_verifications.update_updated_at();

-- =====================================================
-- TRIGGER: Registrar en audit log
-- =====================================================

CREATE OR REPLACE FUNCTION identity_verifications.log_session_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO identity_verifications.audit_log (
      session_id, 
      event_type, 
      event_data, 
      actor_type,
      actor_id
    )
    VALUES (
      NEW.id,
      'session_created',
      jsonb_build_object(
        'purpose', NEW.purpose,
        'provider_id', NEW.provider_id,
        'subject_identifier', NEW.subject_identifier
      ),
      'system',
      NEW.created_by
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
    INSERT INTO identity_verifications.audit_log (
      session_id,
      event_type,
      event_data,
      actor_type,
      actor_id
    )
    VALUES (
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'decision_code', NEW.decision_code,
        'decision_reason', NEW.decision_reason
      ),
      'system',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_session_events
  AFTER INSERT OR UPDATE ON identity_verifications.verification_sessions
  FOR EACH ROW EXECUTE FUNCTION identity_verifications.log_session_changes();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA identity_verifications IS 'Sistema de verificación de identidad independiente del proveedor';
COMMENT ON TABLE identity_verifications.providers IS 'Catálogo de proveedores de verificación (Veriff, Onfido, etc.)';
COMMENT ON TABLE identity_verifications.provider_configs IS 'Configuración de proveedores por organización';
COMMENT ON TABLE identity_verifications.verification_sessions IS 'Sesiones de verificación de identidad';
COMMENT ON TABLE identity_verifications.verification_attempts IS 'Intentos de verificación dentro de una sesión';
COMMENT ON TABLE identity_verifications.verification_documents IS 'Documentos de identidad capturados y extraídos';
COMMENT ON TABLE identity_verifications.verification_media IS 'Archivos multimedia (fotos, selfies, videos)';
COMMENT ON TABLE identity_verifications.audit_log IS 'Log inmutable para auditorías judiciales e internas';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema identity_verifications creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - identity_verifications.providers';
  RAISE NOTICE '  - identity_verifications.provider_configs';
  RAISE NOTICE '  - identity_verifications.verification_sessions';
  RAISE NOTICE '  - identity_verifications.verification_attempts';
  RAISE NOTICE '  - identity_verifications.verification_documents';
  RAISE NOTICE '  - identity_verifications.verification_media';
  RAISE NOTICE '  - identity_verifications.audit_log';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Próximo paso: Aplicar políticas RLS';
END $$;
