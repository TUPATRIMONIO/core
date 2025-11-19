-- Migration: Schema Signatures - Sistema de Firma Electrónica
-- Description: Sistema completo de gestión de firmas electrónicas con proveedores, notarías y webhooks
-- Created: 2025-11-19
-- Timestamp: 20251119004600

-- =====================================================
-- 1. CREAR SCHEMA SIGNATURES
-- =====================================================

CREATE SCHEMA IF NOT EXISTS signatures;

SET search_path TO signatures, core, public, extensions;

-- =====================================================
-- 2. ENUMS
-- =====================================================

-- Estado del documento en el flujo
CREATE TYPE signatures.document_status AS ENUM (
  'draft',              -- Borrador, aún no enviado
  'pending_signatures', -- Esperando firmas
  'partially_signed',   -- Algunas firmas completadas
  'fully_signed',       -- Todas las firmas completadas
  'pending_notary',     -- Enviado a notaría
  'notary_processing',  -- Notaría procesando
  'completed',          -- Todo completado
  'rejected',           -- Rechazado por algún firmante
  'expired',            -- Expiró sin completarse
  'cancelled'           -- Cancelado por el creador
);

-- Estado de cada firmante
CREATE TYPE signatures.signer_status AS ENUM (
  'pending',            -- Esperando que firme
  'notified',           -- Notificación enviada
  'viewed',             -- Vio el documento
  'signed',             -- Firmó
  'rejected',           -- Rechazó firmar
  'expired'             -- Expiró su turno
);

-- Rol del firmante
CREATE TYPE signatures.signer_role AS ENUM (
  'signer',             -- Firmante principal
  'witness',            -- Testigo
  'approver',           -- Aprobador
  'copy_recipient'      -- Solo recibe copia
);

-- Tipo de firma
CREATE TYPE signatures.signature_type AS ENUM (
  'fes',                -- Firma Electrónica Simple
  'fes_biometric',      -- FES con biometría
  'fes_clave_unica',    -- FES con Clave Única
  'fea'                 -- Firma Electrónica Avanzada
);

-- Estado del servicio notarial
CREATE TYPE signatures.notary_status AS ENUM (
  'pending',            -- Pendiente de envío
  'sent',               -- Enviado a notaría
  'received',           -- Notaría recibió
  'processing',         -- En proceso
  'completed',          -- Completado
  'rejected',           -- Rechazado por notaría
  'cancelled'           -- Cancelado
);

-- Tipo de evento
CREATE TYPE signatures.event_type AS ENUM (
  'document_created',
  'document_sent',
  'signer_notified',
  'signer_reminder_sent',
  'signer_viewed',
  'signer_signed',
  'signer_rejected',
  'document_fully_signed',
  'document_expired',
  'document_cancelled',
  'notary_sent',
  'notary_received',
  'notary_completed',
  'notary_rejected',
  'webhook_delivered',
  'webhook_failed'
);

-- =====================================================
-- 3. PROVIDERS - Proveedores de firma
-- =====================================================

CREATE TABLE signatures.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Tipos de firma que soporta
  supported_types signatures.signature_type[] NOT NULL,

  -- Configuración de integración
  api_endpoint TEXT,
  api_credentials JSONB,  -- Encriptado

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. NOTARY_SERVICE_TYPES - Tipos de servicios notariales
-- =====================================================

CREATE TABLE signatures.notary_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Precio base en CLP
  base_price INTEGER NOT NULL,

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. NOTARIES - Notarías registradas
-- =====================================================

CREATE TABLE signatures.notaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información de la notaría
  name TEXT NOT NULL,
  notary_name TEXT,

  -- Ubicación
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT,

  -- Contacto
  email TEXT NOT NULL,
  phone TEXT,

  -- Servicios que ofrece
  available_services UUID[] DEFAULT '{}',

  -- Portal de notaría (usuario que accede al portal)
  portal_user_id UUID REFERENCES core.users(id),

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. DOCUMENTS - Documentos a firmar
-- =====================================================

CREATE TABLE signatures.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Información del documento
  title TEXT NOT NULL CHECK (length(title) >= 3),
  description TEXT,

  -- Archivos
  original_file_url TEXT NOT NULL,
  signed_file_url TEXT,
  final_file_url TEXT,

  -- Tipo de firma requerida
  signature_type signatures.signature_type NOT NULL,
  provider_id UUID REFERENCES signatures.providers(id),

  -- Estado
  status signatures.document_status NOT NULL DEFAULT 'draft',

  -- Configuración
  signing_order TEXT DEFAULT 'parallel' CHECK (signing_order IN ('parallel', 'sequential')),

  -- Expiración y recordatorios
  expires_at TIMESTAMPTZ,
  reminder_days INTEGER[] DEFAULT '{3, 7}',

  -- Servicio notarial (opcional)
  requires_notary BOOLEAN DEFAULT false,
  notary_service_type_id UUID REFERENCES signatures.notary_service_types(id),
  preferred_notary_id UUID REFERENCES signatures.notaries(id),

  -- Destinatarios adicionales
  copy_recipients JSONB DEFAULT '[]',

  -- Creador
  created_by UUID NOT NULL REFERENCES core.users(id),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- 7. DOCUMENT_SIGNERS - Firmantes del documento
-- =====================================================

CREATE TABLE signatures.document_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  document_id UUID NOT NULL REFERENCES signatures.documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Información del firmante
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone TEXT,

  -- Identificación
  id_type TEXT DEFAULT 'rut' CHECK (id_type IN ('rut', 'passport', 'dni', 'other')),
  id_number TEXT,
  country TEXT DEFAULT 'CL',

  -- Rol y orden
  role signatures.signer_role NOT NULL DEFAULT 'signer',
  signing_order INTEGER DEFAULT 1,

  -- Estado
  status signatures.signer_status NOT NULL DEFAULT 'pending',

  -- Tracking
  access_token TEXT UNIQUE NOT NULL,
  notified_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Recordatorios
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  -- Auditoría
  signed_from_ip INET,
  signed_user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_signer_per_document UNIQUE (document_id, email)
);

-- =====================================================
-- 8. DOCUMENT_SIGNATURES - Firmas realizadas
-- =====================================================

CREATE TABLE signatures.document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  document_id UUID NOT NULL REFERENCES signatures.documents(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES signatures.document_signers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Información de la firma
  signature_type signatures.signature_type NOT NULL,
  provider_id UUID REFERENCES signatures.providers(id),

  -- Respuesta del proveedor
  provider_signature_id TEXT,
  provider_response JSONB,

  -- Certificado (si aplica)
  certificate_serial TEXT,
  certificate_issuer TEXT,

  -- Posición en el documento
  page_number INTEGER,
  position_x DECIMAL,
  position_y DECIMAL,

  -- Timestamp
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 9. NOTARY_REQUESTS - Solicitudes a notarías
-- =====================================================

CREATE TABLE signatures.notary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  document_id UUID NOT NULL REFERENCES signatures.documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  notary_id UUID NOT NULL REFERENCES signatures.notaries(id),
  service_type_id UUID NOT NULL REFERENCES signatures.notary_service_types(id),

  -- Estado
  status signatures.notary_status NOT NULL DEFAULT 'pending',

  -- Archivos
  sent_file_url TEXT,
  returned_file_url TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notas
  notary_notes TEXT,
  internal_notes TEXT,

  -- Precio
  price INTEGER NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 10. DOCUMENT_EVENTS - Historial de eventos
-- =====================================================

CREATE TABLE signatures.document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  document_id UUID NOT NULL REFERENCES signatures.documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES signatures.document_signers(id),

  -- Evento
  event_type signatures.event_type NOT NULL,
  description TEXT,

  -- Datos adicionales
  metadata JSONB DEFAULT '{}',

  -- Quién
  performed_by UUID REFERENCES core.users(id),

  -- Auditoría
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 11. WEBHOOKS - Configuración por organización
-- =====================================================

CREATE TABLE signatures.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Configuración
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,

  -- Eventos a enviar
  events signatures.event_type[] NOT NULL,

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Retry config
  max_retries INTEGER DEFAULT 3,

  -- Stats
  last_triggered_at TIMESTAMPTZ,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. WEBHOOK_DELIVERIES - Intentos de entrega
-- =====================================================

CREATE TABLE signatures.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  webhook_id UUID NOT NULL REFERENCES signatures.webhooks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES signatures.documents(id) ON DELETE CASCADE,

  -- Evento
  event_type signatures.event_type NOT NULL,
  payload JSONB NOT NULL,

  -- Resultado
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  http_status INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Retries
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- =====================================================
-- 13. SIGNATURE_PRICING - Precios personalizados por org
-- =====================================================

CREATE TABLE signatures.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Tipo (uno u otro)
  signature_type signatures.signature_type,
  notary_service_type_id UUID REFERENCES signatures.notary_service_types(id),

  -- Precio personalizado
  custom_price INTEGER,

  -- Descuento
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_pricing_per_org UNIQUE (organization_id, signature_type, notary_service_type_id),
  CONSTRAINT has_one_type CHECK (
    (signature_type IS NOT NULL AND notary_service_type_id IS NULL) OR
    (signature_type IS NULL AND notary_service_type_id IS NOT NULL)
  )
);

-- =====================================================
-- 14. ÍNDICES
-- =====================================================

-- Documents
CREATE INDEX idx_documents_org ON signatures.documents(organization_id, created_at DESC);
CREATE INDEX idx_documents_status ON signatures.documents(organization_id, status);
CREATE INDEX idx_documents_created_by ON signatures.documents(created_by);
CREATE INDEX idx_documents_expires ON signatures.documents(expires_at)
  WHERE status IN ('pending_signatures', 'partially_signed');

-- Document Signers
CREATE INDEX idx_signers_document ON signatures.document_signers(document_id);
CREATE INDEX idx_signers_email ON signatures.document_signers(email);
CREATE INDEX idx_signers_token ON signatures.document_signers(access_token);
CREATE INDEX idx_signers_status ON signatures.document_signers(document_id, status);

-- Signatures
CREATE INDEX idx_signatures_document ON signatures.document_signatures(document_id);
CREATE INDEX idx_signatures_signer ON signatures.document_signatures(signer_id);

-- Events
CREATE INDEX idx_events_document ON signatures.document_events(document_id, created_at DESC);
CREATE INDEX idx_events_org ON signatures.document_events(organization_id, created_at DESC);

-- Notary Requests
CREATE INDEX idx_notary_requests_document ON signatures.notary_requests(document_id);
CREATE INDEX idx_notary_requests_notary ON signatures.notary_requests(notary_id, status);
CREATE INDEX idx_notary_requests_status ON signatures.notary_requests(organization_id, status);

-- Webhooks
CREATE INDEX idx_webhooks_org ON signatures.webhooks(organization_id);
CREATE INDEX idx_webhook_deliveries_webhook ON signatures.webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON signatures.webhook_deliveries(next_retry_at)
  WHERE status = 'pending';

-- Notaries
CREATE INDEX idx_notaries_region ON signatures.notaries(region, city) WHERE is_active = true;
CREATE INDEX idx_notaries_portal_user ON signatures.notaries(portal_user_id) WHERE portal_user_id IS NOT NULL;

-- =====================================================
-- 15. TRIGGERS
-- =====================================================

-- Function para actualizar updated_at
CREATE OR REPLACE FUNCTION signatures.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON signatures.providers
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_notary_service_types_updated_at
  BEFORE UPDATE ON signatures.notary_service_types
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_notaries_updated_at
  BEFORE UPDATE ON signatures.notaries
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON signatures.documents
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_document_signers_updated_at
  BEFORE UPDATE ON signatures.document_signers
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_notary_requests_updated_at
  BEFORE UPDATE ON signatures.notary_requests
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON signatures.webhooks
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

CREATE TRIGGER update_pricing_updated_at
  BEFORE UPDATE ON signatures.pricing
  FOR EACH ROW EXECUTE FUNCTION signatures.update_updated_at();

-- =====================================================
-- 16. HABILITAR RLS
-- =====================================================

ALTER TABLE signatures.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.notary_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.notaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.document_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.notary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures.pricing ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 17. RLS POLICIES
-- =====================================================

-- Providers (lectura pública)
CREATE POLICY "Anyone can view active providers"
ON signatures.providers FOR SELECT
USING (is_active = true);

-- Notary Service Types (lectura pública)
CREATE POLICY "Anyone can view active service types"
ON signatures.notary_service_types FOR SELECT
USING (is_active = true);

-- Notaries (lectura pública para activas, gestión por portal user)
CREATE POLICY "Anyone can view active notaries"
ON signatures.notaries FOR SELECT
USING (is_active = true);

CREATE POLICY "Notary portal users can manage their notary"
ON signatures.notaries FOR UPDATE
USING (portal_user_id = auth.uid());

-- Documents
CREATE POLICY "Users view own org documents"
ON signatures.documents FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users create documents in own org"
ON signatures.documents FOR INSERT
WITH CHECK (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users update own org documents"
ON signatures.documents FOR UPDATE
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users delete own org documents"
ON signatures.documents FOR DELETE
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Document Signers (acceso por token para firmantes externos)
CREATE POLICY "Users view own org signers"
ON signatures.document_signers FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Signers can view by token"
ON signatures.document_signers FOR SELECT
USING (true);  -- Filtrado por access_token en la app

CREATE POLICY "Users manage own org signers"
ON signatures.document_signers FOR ALL
USING (organization_id IN (SELECT core.get_user_organization_ids()));

-- Document Signatures
CREATE POLICY "Users view own org signatures"
ON signatures.document_signatures FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users create signatures in own org"
ON signatures.document_signatures FOR INSERT
WITH CHECK (organization_id IN (SELECT core.get_user_organization_ids()));

-- Notary Requests
CREATE POLICY "Users view own org notary requests"
ON signatures.notary_requests FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users create notary requests in own org"
ON signatures.notary_requests FOR INSERT
WITH CHECK (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users update own org notary requests"
ON signatures.notary_requests FOR UPDATE
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Notaries can view assigned requests"
ON signatures.notary_requests FOR SELECT
USING (
  notary_id IN (
    SELECT id FROM signatures.notaries WHERE portal_user_id = auth.uid()
  )
);

CREATE POLICY "Notaries can update assigned requests"
ON signatures.notary_requests FOR UPDATE
USING (
  notary_id IN (
    SELECT id FROM signatures.notaries WHERE portal_user_id = auth.uid()
  )
);

-- Document Events
CREATE POLICY "Users view own org events"
ON signatures.document_events FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "System can insert events"
ON signatures.document_events FOR INSERT
WITH CHECK (true);  -- Insertados por el sistema

-- Webhooks
CREATE POLICY "Users view own org webhooks"
ON signatures.webhooks FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage webhooks"
ON signatures.webhooks FOR ALL
USING (core.is_org_admin(organization_id));

-- Webhook Deliveries
CREATE POLICY "Users view own org webhook deliveries"
ON signatures.webhook_deliveries FOR SELECT
USING (
  webhook_id IN (
    SELECT id FROM signatures.webhooks
    WHERE organization_id IN (SELECT core.get_user_organization_ids())
  )
);

-- Pricing
CREATE POLICY "Users view own org pricing"
ON signatures.pricing FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage pricing"
ON signatures.pricing FOR ALL
USING (core.is_org_admin(organization_id));

-- =====================================================
-- 18. DATOS INICIALES
-- =====================================================

-- Proveedores
INSERT INTO signatures.providers (name, slug, supported_types, is_active) VALUES
('TuPatrimonio FES', 'tupatrimonio_fes', ARRAY['fes', 'fes_biometric']::signatures.signature_type[], true),
('Certificadora del Sur', 'cert_sur', ARRAY['fea']::signatures.signature_type[], true),
('Clave Única', 'clave_unica', ARRAY['fes_clave_unica']::signatures.signature_type[], true);

-- Servicios notariales
INSERT INTO signatures.notary_service_types (name, slug, base_price, sort_order) VALUES
('Copia Certificada', 'copia_certificada', 8990, 1),
('Protocolización', 'protocolizacion', 15990, 2),
('Firma Ante Notario', 'fan', 9990, 3);

-- Registrar signatures como aplicación del ecosistema
INSERT INTO core.applications (
  name,
  slug,
  description,
  category,
  version,
  is_active,
  requires_subscription,
  default_config
) VALUES (
  'Firma Electrónica',
  'signatures',
  'Sistema completo de firma electrónica con múltiples proveedores y servicios notariales',
  'core',
  '1.0.0',
  true,
  false,
  jsonb_build_object(
    'default_signature_type', 'fes',
    'default_expiration_days', 30,
    'reminder_days', ARRAY[3, 7],
    'auto_reminders', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  default_config = EXCLUDED.default_config;

-- Productos de firma
INSERT INTO core.products (name, slug, type, credit_price, credit_discount_percent, schema_name, is_active) VALUES
('Firma Electrónica Simple', 'fes', 'signature', 70, 10, 'signatures', true),
('Firma Electrónica Simple Biométrica', 'fes_biometric', 'signature', 80, 10, 'signatures', true),
('Firma Electrónica Simple Clave Única', 'fes_clave_unica', 'signature', 80, 10, 'signatures', true),
('Firma Electrónica Avanzada', 'fea', 'signature', 90, 10, 'signatures', true)
ON CONFLICT (slug) DO UPDATE SET
  credit_price = EXCLUDED.credit_price,
  credit_discount_percent = EXCLUDED.credit_discount_percent;

-- Precios en CLP
INSERT INTO core.product_prices (product_id, currency, price)
SELECT id, 'CLP',
  CASE slug
    WHEN 'fes' THEN 6990
    WHEN 'fes_biometric' THEN 7990
    WHEN 'fes_clave_unica' THEN 7990
    WHEN 'fea' THEN 8990
  END
FROM core.products WHERE slug IN ('fes', 'fes_biometric', 'fes_clave_unica', 'fea')
ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

-- Productos de servicios notariales
INSERT INTO core.products (name, slug, type, credit_price, credit_discount_percent, schema_name, is_active) VALUES
('Copia Certificada', 'notary_copia_certificada', 'notary_service', 90, 10, 'signatures', true),
('Protocolización', 'notary_protocolizacion', 'notary_service', 160, 10, 'signatures', true),
('Firma Ante Notario', 'notary_fan', 'notary_service', 100, 10, 'signatures', true)
ON CONFLICT (slug) DO UPDATE SET
  credit_price = EXCLUDED.credit_price,
  credit_discount_percent = EXCLUDED.credit_discount_percent;

-- Precios notariales en CLP
INSERT INTO core.product_prices (product_id, currency, price)
SELECT id, 'CLP',
  CASE slug
    WHEN 'notary_copia_certificada' THEN 8990
    WHEN 'notary_protocolizacion' THEN 15990
    WHEN 'notary_fan' THEN 9990
  END
FROM core.products WHERE slug IN ('notary_copia_certificada', 'notary_protocolizacion', 'notary_fan')
ON CONFLICT (product_id, currency) DO UPDATE SET price = EXCLUDED.price;

-- =====================================================
-- 19. FUNCIONES HELPER
-- =====================================================

-- Generar token de acceso para firmantes
CREATE OR REPLACE FUNCTION signatures.generate_access_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Obtener estadísticas de documentos por organización
CREATE OR REPLACE FUNCTION signatures.get_stats(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  total_documents INTEGER;
  pending_documents INTEGER;
  completed_documents INTEGER;
  total_signatures INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_documents
  FROM signatures.documents
  WHERE organization_id = p_org_id;

  SELECT COUNT(*) INTO pending_documents
  FROM signatures.documents
  WHERE organization_id = p_org_id
  AND status IN ('pending_signatures', 'partially_signed', 'pending_notary', 'notary_processing');

  SELECT COUNT(*) INTO completed_documents
  FROM signatures.documents
  WHERE organization_id = p_org_id
  AND status = 'completed';

  SELECT COUNT(*) INTO total_signatures
  FROM signatures.document_signatures
  WHERE organization_id = p_org_id;

  RETURN json_build_object(
    'total_documents', total_documents,
    'pending_documents', pending_documents,
    'completed_documents', completed_documents,
    'total_signatures', total_signatures
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si documento puede ser enviado
CREATE OR REPLACE FUNCTION signatures.can_send_document(p_document_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  doc_status signatures.document_status;
  signer_count INTEGER;
BEGIN
  SELECT status INTO doc_status
  FROM signatures.documents
  WHERE id = p_document_id;

  IF doc_status != 'draft' THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO signer_count
  FROM signatures.document_signers
  WHERE document_id = p_document_id
  AND role != 'copy_recipient';

  RETURN signer_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar estado del documento basado en firmas
CREATE OR REPLACE FUNCTION signatures.update_document_status()
RETURNS TRIGGER AS $$
DECLARE
  doc_id UUID;
  total_signers INTEGER;
  signed_count INTEGER;
  rejected_count INTEGER;
BEGIN
  doc_id := COALESCE(NEW.document_id, OLD.document_id);

  SELECT
    COUNT(*) FILTER (WHERE role != 'copy_recipient'),
    COUNT(*) FILTER (WHERE status = 'signed' AND role != 'copy_recipient'),
    COUNT(*) FILTER (WHERE status = 'rejected' AND role != 'copy_recipient')
  INTO total_signers, signed_count, rejected_count
  FROM signatures.document_signers
  WHERE document_id = doc_id;

  IF rejected_count > 0 THEN
    UPDATE signatures.documents
    SET status = 'rejected', updated_at = NOW()
    WHERE id = doc_id AND status NOT IN ('rejected', 'cancelled');
  ELSIF signed_count = total_signers AND total_signers > 0 THEN
    UPDATE signatures.documents
    SET
      status = CASE
        WHEN requires_notary THEN 'pending_notary'
        ELSE 'fully_signed'
      END,
      updated_at = NOW()
    WHERE id = doc_id AND status NOT IN ('fully_signed', 'pending_notary', 'completed', 'rejected', 'cancelled');
  ELSIF signed_count > 0 THEN
    UPDATE signatures.documents
    SET status = 'partially_signed', updated_at = NOW()
    WHERE id = doc_id AND status = 'pending_signatures';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_status_on_signer_change
  AFTER UPDATE OF status ON signatures.document_signers
  FOR EACH ROW EXECUTE FUNCTION signatures.update_document_status();

-- =====================================================
-- 20. GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA signatures TO authenticated;
GRANT USAGE ON SCHEMA signatures TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA signatures TO authenticated;
GRANT INSERT, UPDATE, DELETE ON signatures.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON signatures.document_signers TO authenticated;
GRANT INSERT ON signatures.document_signatures TO authenticated;
GRANT INSERT, UPDATE ON signatures.notary_requests TO authenticated;
GRANT INSERT ON signatures.document_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON signatures.webhooks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON signatures.pricing TO authenticated;

GRANT SELECT ON signatures.providers TO anon;
GRANT SELECT ON signatures.notary_service_types TO anon;
GRANT SELECT ON signatures.notaries TO anon;
GRANT SELECT ON signatures.document_signers TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA signatures TO authenticated;

GRANT EXECUTE ON FUNCTION signatures.generate_access_token() TO authenticated;
GRANT EXECUTE ON FUNCTION signatures.get_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION signatures.can_send_document(UUID) TO authenticated;

-- =====================================================
-- 21. STORAGE BUCKET PARA DOCUMENTOS
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('signature-documents', 'signature-documents', false, 52428800)  -- 50MB
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Users can upload signature documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signature-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their org signature documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signature-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their signature documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signature-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their signature documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signature-documents'
  AND auth.uid() IS NOT NULL
);

-- =====================================================
-- 22. COMENTARIOS
-- =====================================================

COMMENT ON SCHEMA signatures IS 'Sistema de firma electrónica con múltiples proveedores, servicios notariales y webhooks';

COMMENT ON TABLE signatures.providers IS 'Proveedores de firma electrónica (TuPatrimonio FES, Certificadora del Sur, etc.)';
COMMENT ON TABLE signatures.notary_service_types IS 'Tipos de servicios notariales disponibles (Copia Certificada, Protocolización, FAN)';
COMMENT ON TABLE signatures.notaries IS 'Notarías registradas en el sistema con acceso a portal';
COMMENT ON TABLE signatures.documents IS 'Documentos a firmar con estado del flujo';
COMMENT ON TABLE signatures.document_signers IS 'Firmantes de cada documento con tracking de estado';
COMMENT ON TABLE signatures.document_signatures IS 'Firmas realizadas con respuesta del proveedor';
COMMENT ON TABLE signatures.notary_requests IS 'Solicitudes de servicios notariales por documento';
COMMENT ON TABLE signatures.document_events IS 'Historial de eventos por documento para auditoría';
COMMENT ON TABLE signatures.webhooks IS 'Configuración de webhooks por organización';
COMMENT ON TABLE signatures.webhook_deliveries IS 'Intentos de entrega de webhooks';
COMMENT ON TABLE signatures.pricing IS 'Precios personalizados por organización';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Schema Signatures creado exitosamente';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ signatures.providers - Proveedores de firma';
  RAISE NOTICE '  ✅ signatures.notary_service_types - Tipos de servicios notariales';
  RAISE NOTICE '  ✅ signatures.notaries - Notarías registradas';
  RAISE NOTICE '  ✅ signatures.documents - Documentos a firmar';
  RAISE NOTICE '  ✅ signatures.document_signers - Firmantes';
  RAISE NOTICE '  ✅ signatures.document_signatures - Firmas realizadas';
  RAISE NOTICE '  ✅ signatures.notary_requests - Solicitudes a notarías';
  RAISE NOTICE '  ✅ signatures.document_events - Historial de eventos';
  RAISE NOTICE '  ✅ signatures.webhooks - Configuración de webhooks';
  RAISE NOTICE '  ✅ signatures.webhook_deliveries - Entregas de webhooks';
  RAISE NOTICE '  ✅ signatures.pricing - Precios personalizados';
  RAISE NOTICE '';
  RAISE NOTICE 'Proveedores configurados:';
  RAISE NOTICE '  - TuPatrimonio FES (FES, FES Biométrica)';
  RAISE NOTICE '  - Certificadora del Sur (FEA)';
  RAISE NOTICE '  - Clave Única (FES Clave Única)';
  RAISE NOTICE '';
  RAISE NOTICE 'Servicios notariales:';
  RAISE NOTICE '  - Copia Certificada: $8.990';
  RAISE NOTICE '  - Protocolización: $15.990';
  RAISE NOTICE '  - Firma Ante Notario: $9.990';
  RAISE NOTICE '';
  RAISE NOTICE 'Productos creados en core.products:';
  RAISE NOTICE '  - FES: $6.990 (70 créditos)';
  RAISE NOTICE '  - FES Biométrica: $7.990 (80 créditos)';
  RAISE NOTICE '  - FES Clave Única: $7.990 (80 créditos)';
  RAISE NOTICE '  - FEA: $8.990 (90 créditos)';
  RAISE NOTICE '';
  RAISE NOTICE 'Storage bucket creado: signature-documents';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximos pasos:';
  RAISE NOTICE '  1. Aplicar migración: supabase db push';
  RAISE NOTICE '  2. Configurar API credentials de proveedores';
  RAISE NOTICE '  3. Registrar notarías';
  RAISE NOTICE '  4. Implementar UI en apps/web';
  RAISE NOTICE '';
END $$;
