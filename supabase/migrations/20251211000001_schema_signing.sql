-- =====================================================
-- Migration: Create signing schema
-- Description: Sistema completo de firma electrónica de documentos
-- Created: 2025-12-11
-- =====================================================

-- Crear el schema signing
CREATE SCHEMA IF NOT EXISTS signing;

-- Set search path
SET search_path TO signing, core, billing, public, extensions;

-- =====================================================
-- ENUMS
-- =====================================================

-- Estado del documento
CREATE TYPE signing.document_status AS ENUM (
  'draft',              -- Borrador
  'pending_review',     -- En revisión/aprobación
  'approved',           -- Aprobado, listo para firmar
  'pending_ai_review',  -- Esperando revisión IA
  'ai_rejected',        -- Rechazado por IA
  'manual_review',      -- En revisión manual
  'pending_signature',  -- En proceso de firma
  'partially_signed',   -- Parcialmente firmado
  'signed',             -- Completamente firmado
  'pending_notary',     -- Enviado a notaría
  'notary_observed',    -- Notaría tiene observaciones
  'notary_rejected',    -- Rechazado por notaría
  'notarized',          -- Notarizado
  'completed',          -- Completado
  'cancelled',          -- Cancelado
  'rejected'            -- Rechazado
);

-- Estado del firmante
CREATE TYPE signing.signer_status AS ENUM (
  'pending',            -- Pendiente
  'needs_enrollment',   -- Necesita enrolamiento FEA
  'enrolled',           -- Enrolado
  'certificate_blocked', -- Certificado bloqueado
  'sf_blocked',         -- Segundo factor bloqueado
  'signing',            -- En proceso de firma
  'signed',             -- Firmado
  'rejected',           -- Rechazó firmar
  'removed',            -- Removido del proceso (sin afectar firmados)
  'expired'             -- Token expirado
);

-- Tipo de servicio notarial
CREATE TYPE signing.notary_service_type AS ENUM (
  'none',               -- Sin servicio notarial
  'legalized_copy',     -- Copia legalizada
  'protocolization',    -- Protocolización
  'authorized_signature' -- Firma autorizada por notario
);

-- Orden de firma
CREATE TYPE signing.signing_order_type AS ENUM (
  'simultaneous',  -- Todos firman al mismo tiempo
  'sequential'     -- Firman en orden específico
);

-- Estado de solicitud notarial
CREATE TYPE signing.notary_request_status AS ENUM (
  'pending',      -- Pendiente de envío
  'sent',         -- Enviado a notaría
  'in_review',    -- En revisión por notario
  'observed',     -- Notario tiene observaciones
  'rejected',     -- Rechazado por notario
  'approved',     -- Aprobado, firma pendiente
  'signed',       -- Firmado por notario
  'completed'     -- Proceso completado
);

-- Estado de revisión
CREATE TYPE signing.review_status AS ENUM (
  'pending',      -- Pendiente de revisión
  'approved',     -- Aprobado
  'rejected',     -- Rechazado
  'needs_changes' -- Requiere cambios
);

-- Tipo de versión de documento
CREATE TYPE signing.version_type AS ENUM (
  'original',     -- Documento original subido
  'draft',        -- Versión modificada/borrador
  'pre_signature', -- Versión antes de firmas (con QR)
  'partial_signature', -- Con algunas firmas
  'fully_signed', -- Con todas las firmas
  'notarized'     -- Firmado por notario
);

-- =====================================================
-- PROVIDERS (Proveedores de firma)
-- =====================================================

CREATE TABLE signing.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del proveedor
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  description TEXT,
  
  -- Tipo de servicio
  provider_type TEXT NOT NULL CHECK (provider_type IN ('signature', 'identity', 'both')),
  
  -- Configuración base de la API
  base_url TEXT NOT NULL,
  test_url TEXT, -- URL para ambiente de pruebas
  
  -- Endpoints disponibles (JSONB para flexibilidad)
  endpoints JSONB NOT NULL DEFAULT '{}',
  
  -- Códigos de error del proveedor
  error_codes JSONB NOT NULL DEFAULT '{}',
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  
  -- Países soportados
  supported_countries TEXT[] DEFAULT ARRAY['CL'],
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_providers_slug ON signing.providers(slug);
CREATE INDEX idx_providers_active ON signing.providers(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_providers_default ON signing.providers(is_default) WHERE is_default = true;

-- =====================================================
-- PROVIDER CONFIGS (Configuración por organización)
-- =====================================================

CREATE TABLE signing.provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES signing.providers(id) ON DELETE CASCADE,
  
  -- Credenciales (encriptadas idealmente)
  credentials JSONB NOT NULL DEFAULT '{}', -- usuario, clave, etc.
  
  -- Configuración específica
  config JSONB NOT NULL DEFAULT '{}', -- urlNotificacion, urlRetorno, etc.
  
  -- Webhook URL para recibir notificaciones del proveedor
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_test_mode BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint único
  CONSTRAINT unique_org_provider UNIQUE (organization_id, provider_id)
);

-- Índices
CREATE INDEX idx_provider_configs_org ON signing.provider_configs(organization_id);
CREATE INDEX idx_provider_configs_provider ON signing.provider_configs(provider_id);

-- =====================================================
-- DOCUMENTS (Documento principal)
-- =====================================================

CREATE TABLE signing.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Referencia a pedido (billing)
  order_id UUID REFERENCES billing.orders(id) ON DELETE SET NULL,
  
  -- Información del documento
  title TEXT NOT NULL CHECK (length(title) >= 2 AND length(title) <= 200),
  description TEXT,
  
  -- Estado
  status signing.document_status NOT NULL DEFAULT 'draft',
  
  -- Archivo original
  original_file_path TEXT, -- Path en Supabase Storage
  original_file_name TEXT,
  original_file_size BIGINT,
  original_file_type TEXT DEFAULT 'application/pdf',
  
  -- Archivo con QR (después de agregar portada)
  qr_file_path TEXT,
  
  -- Archivo firmado actual
  current_signed_file_path TEXT,
  
  -- Identificador único para QR
  qr_identifier TEXT UNIQUE,
  
  -- Configuración de firma
  signing_order signing.signing_order_type NOT NULL DEFAULT 'simultaneous',
  signers_count SMALLINT NOT NULL DEFAULT 0,
  signed_count SMALLINT NOT NULL DEFAULT 0,
  
  -- Servicio notarial
  notary_service signing.notary_service_type NOT NULL DEFAULT 'none',
  
  -- Configuración de revisión
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  requires_ai_review BOOLEAN NOT NULL DEFAULT true,
  all_reviewers_must_approve BOOLEAN NOT NULL DEFAULT true,
  
  -- Opciones de notificación
  send_to_signers_on_complete BOOLEAN NOT NULL DEFAULT true,
  
  -- Gestor del documento
  created_by UUID NOT NULL REFERENCES core.users(id),
  manager_id UUID REFERENCES core.users(id), -- Persona responsable
  
  -- Proveedor de firma
  provider_id UUID REFERENCES signing.providers(id),
  provider_config_id UUID REFERENCES signing.provider_configs(id),
  
  -- Código de transacción del proveedor
  provider_transaction_code TEXT,
  
  -- Personalización
  custom_cover_path TEXT, -- Portada personalizada
  watermark_text TEXT,
  logo_path TEXT,
  
  -- Metadata adicional
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Fechas importantes
  approved_at TIMESTAMPTZ,
  sent_to_sign_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Fecha límite para firmar
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_documents_org ON signing.documents(organization_id);
CREATE INDEX idx_documents_status ON signing.documents(status);
CREATE INDEX idx_documents_order ON signing.documents(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_documents_created_by ON signing.documents(created_by);
CREATE INDEX idx_documents_manager ON signing.documents(manager_id) WHERE manager_id IS NOT NULL;
CREATE INDEX idx_documents_qr ON signing.documents(qr_identifier) WHERE qr_identifier IS NOT NULL;
CREATE INDEX idx_documents_provider_tx ON signing.documents(provider_transaction_code) WHERE provider_transaction_code IS NOT NULL;
CREATE INDEX idx_documents_created ON signing.documents(created_at DESC);

-- =====================================================
-- DOCUMENT VERSIONS (Historial de versiones)
-- =====================================================

CREATE TABLE signing.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  
  -- Información de la versión
  version_number INTEGER NOT NULL,
  version_type signing.version_type NOT NULL,
  
  -- Archivo
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_hash TEXT, -- SHA-256 para verificación de integridad
  
  -- Descripción del cambio
  change_description TEXT,
  
  -- Quién creó esta versión
  created_by UUID REFERENCES core.users(id),
  
  -- Para versiones de firma
  signer_id UUID REFERENCES core.users(id), -- Si fue creada por un firmante
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint único por documento y número de versión
  CONSTRAINT unique_version_number UNIQUE (document_id, version_number)
);

-- Índices
CREATE INDEX idx_doc_versions_document ON signing.document_versions(document_id);
CREATE INDEX idx_doc_versions_type ON signing.document_versions(document_id, version_type);
CREATE INDEX idx_doc_versions_created ON signing.document_versions(created_at DESC);

-- =====================================================
-- SIGNERS (Firmantes del documento)
-- =====================================================

CREATE TABLE signing.signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  
  -- Información del firmante
  user_id UUID REFERENCES core.users(id), -- Si es usuario registrado
  
  -- Datos del firmante (pueden ser externos)
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2 AND length(full_name) <= 200),
  rut TEXT CHECK (rut ~ '^\d{7,8}-[\dkK]$'), -- Formato chileno sin puntos
  phone TEXT,
  is_foreigner BOOLEAN NOT NULL DEFAULT false,
  
  -- Estado
  status signing.signer_status NOT NULL DEFAULT 'pending',
  
  -- Orden de firma (para modo secuencial)
  signing_order INTEGER NOT NULL DEFAULT 0,
  
  -- Token único para acceso a firma
  signing_token UUID UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Información del certificado FEA (del proveedor)
  fea_vigente BOOLEAN,
  fea_fecha_vencimiento TIMESTAMPTZ,
  certificate_blocked BOOLEAN DEFAULT false,
  
  -- Información de firma realizada
  signed_at TIMESTAMPTZ,
  signature_ip INET,
  signature_user_agent TEXT,
  
  -- Razón de rechazo (si aplica)
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  
  -- Coordenadas de firma (si se especifican)
  use_custom_coordinates BOOLEAN DEFAULT false,
  signature_page INTEGER,
  coord_x_lower_left DECIMAL(10,4),
  coord_y_lower_left DECIMAL(10,4),
  coord_x_upper_right DECIMAL(10,4),
  coord_y_upper_right DECIMAL(10,4),
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un email solo puede estar una vez por documento
  CONSTRAINT unique_email_per_document UNIQUE (document_id, email)
);

-- Índices
CREATE INDEX idx_signers_document ON signing.signers(document_id);
CREATE INDEX idx_signers_user ON signing.signers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_signers_status ON signing.signers(document_id, status);
CREATE INDEX idx_signers_token ON signing.signers(signing_token);
CREATE INDEX idx_signers_email ON signing.signers(email);
CREATE INDEX idx_signers_rut ON signing.signers(rut) WHERE rut IS NOT NULL;
CREATE INDEX idx_signers_order ON signing.signers(document_id, signing_order);

-- =====================================================
-- REVIEWERS (Revisores del documento)
-- =====================================================

CREATE TABLE signing.reviewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Estado de revisión
  status signing.review_status NOT NULL DEFAULT 'pending',
  
  -- Comentario de revisión
  review_comment TEXT,
  
  -- Timestamps
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede revisar una vez por documento
  CONSTRAINT unique_reviewer_per_document UNIQUE (document_id, user_id)
);

-- Índices
CREATE INDEX idx_reviewers_document ON signing.reviewers(document_id);
CREATE INDEX idx_reviewers_user ON signing.reviewers(user_id);
CREATE INDEX idx_reviewers_status ON signing.reviewers(document_id, status);

-- =====================================================
-- REVIEW COMMENTS (Comentarios en el documento)
-- =====================================================

CREATE TABLE signing.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id),
  
  -- Comentario
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  
  -- Posición en el documento (opcional)
  page_number INTEGER,
  position_x DECIMAL(10,4),
  position_y DECIMAL(10,4),
  
  -- Referencia a versión específica
  version_id UUID REFERENCES signing.document_versions(id),
  
  -- Respuesta a otro comentario (threading)
  parent_comment_id UUID REFERENCES signing.review_comments(id),
  
  -- Estado
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES core.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_comments_document ON signing.review_comments(document_id);
CREATE INDEX idx_comments_user ON signing.review_comments(user_id);
CREATE INDEX idx_comments_parent ON signing.review_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_unresolved ON signing.review_comments(document_id, is_resolved) WHERE is_resolved = false;

-- =====================================================
-- AI REVIEWS (Revisiones automáticas por IA)
-- =====================================================

CREATE TABLE signing.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  
  -- Tipo de revisión (basado en tipo de servicio)
  review_type TEXT NOT NULL, -- 'signature', 'notary_legalized', 'notary_protocol', etc.
  
  -- Prompt utilizado
  prompt_template TEXT,
  prompt_used TEXT,
  
  -- Resultado
  status signing.review_status NOT NULL DEFAULT 'pending',
  passed BOOLEAN,
  confidence_score DECIMAL(5,4), -- 0.0000 a 1.0000
  
  -- Razones y feedback
  reasons JSONB NOT NULL DEFAULT '[]', -- Array de razones
  suggestions JSONB NOT NULL DEFAULT '[]', -- Sugerencias de mejora
  raw_response JSONB, -- Respuesta completa del modelo
  
  -- Modelo utilizado
  ai_model TEXT,
  tokens_used INTEGER,
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'
);

-- Índices
CREATE INDEX idx_ai_reviews_document ON signing.ai_reviews(document_id);
CREATE INDEX idx_ai_reviews_status ON signing.ai_reviews(status);
CREATE INDEX idx_ai_reviews_type ON signing.ai_reviews(review_type);

-- =====================================================
-- NOTARY REQUESTS (Solicitudes a notaría)
-- =====================================================

CREATE TABLE signing.notary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  
  -- Tipo de servicio
  service_type signing.notary_service_type NOT NULL,
  
  -- Estado
  status signing.notary_request_status NOT NULL DEFAULT 'pending',
  
  -- Notaría asignada (puede ser una referencia a tabla de notarías)
  notary_id UUID, -- Referencia futura a tabla de notarías
  notary_name TEXT,
  
  -- Archivos en Supabase Storage
  sent_file_path TEXT, -- Documento enviado a notaría
  signed_file_path TEXT, -- Documento firmado por notario
  
  -- Código de transacción/identificador
  notary_reference TEXT,
  
  -- Fechas
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ, -- Cuando notaría confirma recepción
  signed_at TIMESTAMPTZ,   -- Cuando notario firma
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notary_req_document ON signing.notary_requests(document_id);
CREATE INDEX idx_notary_req_status ON signing.notary_requests(status);
CREATE INDEX idx_notary_req_notary ON signing.notary_requests(notary_id) WHERE notary_id IS NOT NULL;

-- =====================================================
-- NOTARY OBSERVATIONS (Observaciones de notaría)
-- =====================================================

CREATE TABLE signing.notary_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notary_request_id UUID NOT NULL REFERENCES signing.notary_requests(id) ON DELETE CASCADE,
  
  -- Tipo de observación
  observation_type TEXT NOT NULL CHECK (observation_type IN ('observation', 'rejection', 'request_docs', 'response', 'internal_note')),
  
  -- Contenido
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 5000),
  
  -- Archivos adjuntos
  attachments JSONB NOT NULL DEFAULT '[]', -- Array de paths en storage
  
  -- Quién creó la observación
  created_by UUID REFERENCES core.users(id), -- NULL si es de la notaría
  is_from_notary BOOLEAN NOT NULL DEFAULT false,
  
  -- Estado de resolución
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES core.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notary_obs_request ON signing.notary_observations(notary_request_id);
CREATE INDEX idx_notary_obs_unresolved ON signing.notary_observations(notary_request_id, is_resolved) WHERE is_resolved = false;

-- =====================================================
-- SIGNER HISTORY (Historial de cambios de firmantes)
-- =====================================================

CREATE TABLE signing.signer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES signing.documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES signing.signers(id) ON DELETE SET NULL,
  
  -- Tipo de acción
  action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'modified', 'reordered')),
  
  -- Datos del firmante al momento del cambio
  signer_data JSONB NOT NULL, -- Snapshot de los datos
  
  -- Quién realizó el cambio
  changed_by UUID NOT NULL REFERENCES core.users(id),
  
  -- Razón del cambio
  reason TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_signer_history_document ON signing.signer_history(document_id);
CREATE INDEX idx_signer_history_signer ON signing.signer_history(signer_id) WHERE signer_id IS NOT NULL;
CREATE INDEX idx_signer_history_created ON signing.signer_history(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION signing.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON signing.documents 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

CREATE TRIGGER update_signers_updated_at 
  BEFORE UPDATE ON signing.signers 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

CREATE TRIGGER update_provider_configs_updated_at 
  BEFORE UPDATE ON signing.provider_configs 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

CREATE TRIGGER update_providers_updated_at 
  BEFORE UPDATE ON signing.providers 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON signing.review_comments 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

CREATE TRIGGER update_notary_requests_updated_at 
  BEFORE UPDATE ON signing.notary_requests 
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- TRIGGER: Sincronizar conteo de firmantes
-- =====================================================

CREATE OR REPLACE FUNCTION signing.sync_signer_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_signed INTEGER;
BEGIN
  -- Contar total de firmantes activos (no removidos)
  SELECT COUNT(*) INTO v_total
  FROM signing.signers
  WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
    AND status != 'removed';
  
  -- Contar firmados
  SELECT COUNT(*) INTO v_signed
  FROM signing.signers
  WHERE document_id = COALESCE(NEW.document_id, OLD.document_id)
    AND status = 'signed';
  
  -- Actualizar documento
  UPDATE signing.documents
  SET signers_count = v_total,
      signed_count = v_signed,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.document_id, OLD.document_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_document_signer_counts
  AFTER INSERT OR UPDATE OR DELETE ON signing.signers
  FOR EACH ROW EXECUTE FUNCTION signing.sync_signer_counts();

-- =====================================================
-- TRIGGER: Actualizar estado del documento cuando todos firman
-- =====================================================

CREATE OR REPLACE FUNCTION signing.check_all_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_doc RECORD;
BEGIN
  -- Solo ejecutar si el estado cambió a 'signed'
  IF NEW.status = 'signed' AND (OLD.status IS NULL OR OLD.status != 'signed') THEN
    -- Bloquear el documento para evitar condiciones de carrera
    SELECT * INTO v_doc
    FROM signing.documents
    WHERE id = NEW.document_id
    FOR UPDATE;
    
    -- Verificar si todos firmaron
    IF v_doc.signed_count + 1 >= v_doc.signers_count THEN
      -- Actualizar estado según si requiere notaría
      IF v_doc.notary_service = 'none' THEN
        UPDATE signing.documents
        SET status = 'completed',
            completed_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.document_id;
      ELSE
        UPDATE signing.documents
        SET status = 'pending_notary',
            updated_at = NOW()
        WHERE id = NEW.document_id;
      END IF;
    ELSIF v_doc.signed_count >= 0 THEN
      UPDATE signing.documents
      SET status = 'partially_signed',
          updated_at = NOW()
      WHERE id = NEW.document_id
        AND status = 'pending_signature';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_document_completion
  AFTER UPDATE ON signing.signers
  FOR EACH ROW EXECUTE FUNCTION signing.check_all_signed();

-- =====================================================
-- TRIGGER: Registrar historial de cambios de firmantes
-- =====================================================

CREATE OR REPLACE FUNCTION signing.log_signer_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'added', to_jsonb(NEW), COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'removed' AND OLD.status != 'removed' THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'removed', to_jsonb(OLD), COALESCE(auth.uid(), NEW.user_id));
  ELSIF TG_OP = 'UPDATE' AND (NEW.email != OLD.email OR NEW.full_name != OLD.full_name OR NEW.rut != OLD.rut) THEN
    INSERT INTO signing.signer_history (document_id, signer_id, action, signer_data, changed_by)
    VALUES (NEW.document_id, NEW.id, 'modified', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)), COALESCE(auth.uid(), NEW.user_id));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_signer_history
  AFTER INSERT OR UPDATE ON signing.signers
  FOR EACH ROW EXECUTE FUNCTION signing.log_signer_changes();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON SCHEMA signing IS 'Sistema de firma electrónica de documentos';
COMMENT ON TABLE signing.documents IS 'Documentos principales para firma electrónica';
COMMENT ON TABLE signing.document_versions IS 'Historial de versiones de cada documento';
COMMENT ON TABLE signing.signers IS 'Firmantes asignados a cada documento';
COMMENT ON TABLE signing.reviewers IS 'Revisores del documento antes de enviar a firma';
COMMENT ON TABLE signing.review_comments IS 'Comentarios y anotaciones durante la revisión';
COMMENT ON TABLE signing.ai_reviews IS 'Revisiones automáticas realizadas por IA';
COMMENT ON TABLE signing.notary_requests IS 'Solicitudes de servicios notariales';
COMMENT ON TABLE signing.notary_observations IS 'Observaciones y comunicaciones con notaría';
COMMENT ON TABLE signing.providers IS 'Proveedores de firma electrónica (CDS, etc.)';
COMMENT ON TABLE signing.provider_configs IS 'Configuración de proveedores por organización';
COMMENT ON TABLE signing.signer_history IS 'Historial de cambios en firmantes';

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema signing creado exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  - signing.providers';
  RAISE NOTICE '  - signing.provider_configs';
  RAISE NOTICE '  - signing.documents';
  RAISE NOTICE '  - signing.document_versions';
  RAISE NOTICE '  - signing.signers';
  RAISE NOTICE '  - signing.reviewers';
  RAISE NOTICE '  - signing.review_comments';
  RAISE NOTICE '  - signing.ai_reviews';
  RAISE NOTICE '  - signing.notary_requests';
  RAISE NOTICE '  - signing.notary_observations';
  RAISE NOTICE '  - signing.signer_history';
END $$;
