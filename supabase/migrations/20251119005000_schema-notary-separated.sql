-- Migration: Separar Notary a Schema Independiente
-- Description: Mueve las tablas de notaría a un schema separado para servicios independientes
-- Created: 2025-11-19
-- Timestamp: 20251119005000

-- =====================================================
-- 1. CREAR SCHEMA NOTARY
-- =====================================================

CREATE SCHEMA IF NOT EXISTS notary;

SET search_path TO notary, signatures, core, public, extensions;

-- =====================================================
-- 2. ENUMS PARA NOTARY
-- =====================================================

-- Estado de la solicitud notarial
CREATE TYPE notary.request_status AS ENUM (
  'pending',            -- Pendiente de envío
  'sent',               -- Enviado a notaría
  'received',           -- Notaría recibió
  'processing',         -- En proceso
  'completed',          -- Completado
  'rejected',           -- Rechazado por notaría
  'cancelled'           -- Cancelado
);

-- Tipo de evento de notaría
CREATE TYPE notary.event_type AS ENUM (
  'request_created',
  'request_sent',
  'request_received',
  'request_processing',
  'request_completed',
  'request_rejected',
  'request_cancelled',
  'document_uploaded',
  'note_added'
);

-- =====================================================
-- 3. SERVICE_TYPES - Tipos de servicios notariales
-- =====================================================

CREATE TABLE notary.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Precio base en CLP
  base_price INTEGER NOT NULL,

  -- Requiere documento previo (ej: para protocolización necesitas el doc firmado)
  requires_document BOOLEAN DEFAULT true,

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. NOTARIES - Notarías registradas
-- =====================================================

CREATE TABLE notary.notaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Información de la notaría
  name TEXT NOT NULL,
  notary_name TEXT,  -- Nombre del notario titular

  -- Ubicación
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT,

  -- Contacto
  email TEXT NOT NULL,
  phone TEXT,

  -- Servicios que ofrece (referencias a service_types)
  available_services UUID[] DEFAULT '{}',

  -- Portal de notaría (usuario que accede)
  portal_user_id UUID REFERENCES core.users(id),

  -- Capacidad y horarios (para futuro)
  settings JSONB DEFAULT '{}',

  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. REQUESTS - Solicitudes de servicios notariales
-- =====================================================

CREATE TABLE notary.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Notaría y servicio
  notary_id UUID NOT NULL REFERENCES notary.notaries(id),
  service_type_id UUID NOT NULL REFERENCES notary.service_types(id),

  -- Referencia OPCIONAL a documento de firma electrónica
  signature_document_id UUID REFERENCES signatures.documents(id),

  -- O documento propio (para servicios sin firma previa)
  document_url TEXT,
  document_title TEXT,

  -- Estado
  status notary.request_status NOT NULL DEFAULT 'pending',

  -- Archivos
  sent_file_url TEXT,      -- Lo que se envía a la notaría
  returned_file_url TEXT,  -- Lo que devuelve la notaría

  -- Tracking
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Notas
  notary_notes TEXT,       -- Notas de la notaría
  internal_notes TEXT,     -- Notas internas

  -- Precio cobrado
  price INTEGER NOT NULL,

  -- Creador
  created_by UUID REFERENCES core.users(id),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Al menos un documento debe existir
  CONSTRAINT has_document CHECK (
    signature_document_id IS NOT NULL OR document_url IS NOT NULL
  )
);

-- =====================================================
-- 6. REQUEST_EVENTS - Historial de eventos
-- =====================================================

CREATE TABLE notary.request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  request_id UUID NOT NULL REFERENCES notary.requests(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Evento
  event_type notary.event_type NOT NULL,
  description TEXT,

  -- Datos adicionales
  metadata JSONB DEFAULT '{}',

  -- Quién
  performed_by UUID REFERENCES core.users(id),

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. PRICING - Precios personalizados por org
-- =====================================================

CREATE TABLE notary.pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Servicio
  service_type_id UUID NOT NULL REFERENCES notary.service_types(id),

  -- Precio personalizado
  custom_price INTEGER,

  -- Descuento
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_notary_pricing_per_org UNIQUE (organization_id, service_type_id)
);

-- =====================================================
-- 8. ÍNDICES
-- =====================================================

-- Notaries
CREATE INDEX idx_notary_notaries_region ON notary.notaries(region, city) WHERE is_active = true;
CREATE INDEX idx_notary_notaries_portal ON notary.notaries(portal_user_id) WHERE portal_user_id IS NOT NULL;

-- Requests
CREATE INDEX idx_notary_requests_org ON notary.requests(organization_id, created_at DESC);
CREATE INDEX idx_notary_requests_notary ON notary.requests(notary_id, status);
CREATE INDEX idx_notary_requests_status ON notary.requests(organization_id, status);
CREATE INDEX idx_notary_requests_signature ON notary.requests(signature_document_id) WHERE signature_document_id IS NOT NULL;

-- Events
CREATE INDEX idx_notary_events_request ON notary.request_events(request_id, created_at DESC);

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION notary.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_types_updated_at
  BEFORE UPDATE ON notary.service_types
  FOR EACH ROW EXECUTE FUNCTION notary.update_updated_at();

CREATE TRIGGER update_notaries_updated_at
  BEFORE UPDATE ON notary.notaries
  FOR EACH ROW EXECUTE FUNCTION notary.update_updated_at();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON notary.requests
  FOR EACH ROW EXECUTE FUNCTION notary.update_updated_at();

CREATE TRIGGER update_pricing_updated_at
  BEFORE UPDATE ON notary.pricing
  FOR EACH ROW EXECUTE FUNCTION notary.update_updated_at();

-- =====================================================
-- 10. HABILITAR RLS
-- =====================================================

ALTER TABLE notary.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary.notaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary.request_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notary.pricing ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. RLS POLICIES
-- =====================================================

-- Service Types (lectura pública)
CREATE POLICY "Anyone can view active notary service types"
ON notary.service_types FOR SELECT
USING (is_active = true);

-- Notaries (lectura pública, gestión por portal user)
CREATE POLICY "Anyone can view active notaries"
ON notary.notaries FOR SELECT
USING (is_active = true);

CREATE POLICY "Notary portal users can update their notary"
ON notary.notaries FOR UPDATE
USING (portal_user_id = auth.uid());

-- Requests
CREATE POLICY "Users view own org notary requests"
ON notary.requests FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users create notary requests in own org"
ON notary.requests FOR INSERT
WITH CHECK (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Users update own org notary requests"
ON notary.requests FOR UPDATE
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Notaries can view assigned requests"
ON notary.requests FOR SELECT
USING (
  notary_id IN (
    SELECT id FROM notary.notaries WHERE portal_user_id = auth.uid()
  )
);

CREATE POLICY "Notaries can update assigned requests"
ON notary.requests FOR UPDATE
USING (
  notary_id IN (
    SELECT id FROM notary.notaries WHERE portal_user_id = auth.uid()
  )
);

-- Request Events
CREATE POLICY "Users view own org notary events"
ON notary.request_events FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "System can insert notary events"
ON notary.request_events FOR INSERT
WITH CHECK (true);

-- Pricing
CREATE POLICY "Users view own org notary pricing"
ON notary.pricing FOR SELECT
USING (organization_id IN (SELECT core.get_user_organization_ids()));

CREATE POLICY "Org admins manage notary pricing"
ON notary.pricing FOR ALL
USING (core.is_org_admin(organization_id));

-- =====================================================
-- 12. MIGRAR DATOS DESDE SIGNATURES
-- =====================================================

-- Migrar service_types
INSERT INTO notary.service_types (id, name, slug, base_price, is_active, sort_order, created_at, updated_at)
SELECT id, name, slug, base_price, is_active, sort_order, created_at, updated_at
FROM signatures.notary_service_types
ON CONFLICT (slug) DO NOTHING;

-- Migrar notaries
INSERT INTO notary.notaries (id, name, notary_name, city, region, address, email, phone, available_services, portal_user_id, is_active, created_at, updated_at)
SELECT id, name, notary_name, city, region, address, email, phone, available_services, portal_user_id, is_active, created_at, updated_at
FROM signatures.notaries
ON CONFLICT DO NOTHING;

-- Migrar requests (si existen)
INSERT INTO notary.requests (
  id, organization_id, notary_id, service_type_id, signature_document_id,
  status, sent_file_url, returned_file_url, sent_at, received_at, completed_at,
  notary_notes, internal_notes, price, created_at, updated_at
)
SELECT
  id, organization_id, notary_id, service_type_id, document_id,
  status::text::notary.request_status, sent_file_url, returned_file_url, sent_at, received_at, completed_at,
  notary_notes, internal_notes, price, created_at, updated_at
FROM signatures.notary_requests
ON CONFLICT DO NOTHING;

-- =====================================================
-- 13. ELIMINAR TABLAS ANTIGUAS DE SIGNATURES
-- =====================================================

-- Primero eliminar la FK de documents a notary_service_types
ALTER TABLE signatures.documents
DROP CONSTRAINT IF EXISTS documents_notary_service_type_id_fkey;

ALTER TABLE signatures.documents
DROP CONSTRAINT IF EXISTS documents_preferred_notary_id_fkey;

-- Eliminar tablas
DROP TABLE IF EXISTS signatures.notary_requests CASCADE;
DROP TABLE IF EXISTS signatures.notaries CASCADE;
DROP TABLE IF EXISTS signatures.notary_service_types CASCADE;

-- Eliminar el tipo enum que ya no se usa
DROP TYPE IF EXISTS signatures.notary_status CASCADE;

-- =====================================================
-- 14. ACTUALIZAR REFERENCES EN SIGNATURES.DOCUMENTS
-- =====================================================

-- Agregar nuevas FK al schema notary
ALTER TABLE signatures.documents
ADD CONSTRAINT documents_notary_service_type_id_fkey
FOREIGN KEY (notary_service_type_id) REFERENCES notary.service_types(id);

ALTER TABLE signatures.documents
ADD CONSTRAINT documents_preferred_notary_id_fkey
FOREIGN KEY (preferred_notary_id) REFERENCES notary.notaries(id);

-- =====================================================
-- 15. FUNCIONES HELPER
-- =====================================================

-- Obtener estadísticas de notaría por organización
CREATE OR REPLACE FUNCTION notary.get_stats(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  total_requests INTEGER;
  pending_requests INTEGER;
  completed_requests INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_requests
  FROM notary.requests
  WHERE organization_id = p_org_id;

  SELECT COUNT(*) INTO pending_requests
  FROM notary.requests
  WHERE organization_id = p_org_id
  AND status IN ('pending', 'sent', 'received', 'processing');

  SELECT COUNT(*) INTO completed_requests
  FROM notary.requests
  WHERE organization_id = p_org_id
  AND status = 'completed';

  RETURN json_build_object(
    'total_requests', total_requests,
    'pending_requests', pending_requests,
    'completed_requests', completed_requests
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener notarías disponibles por región
CREATE OR REPLACE FUNCTION notary.get_available_notaries(p_region TEXT, p_service_type_id UUID DEFAULT NULL)
RETURNS SETOF notary.notaries AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notary.notaries
  WHERE region = p_region
  AND is_active = true
  AND (
    p_service_type_id IS NULL
    OR p_service_type_id = ANY(available_services)
  )
  ORDER BY city, name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 16. GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA notary TO authenticated;
GRANT USAGE ON SCHEMA notary TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA notary TO authenticated;
GRANT INSERT, UPDATE ON notary.requests TO authenticated;
GRANT INSERT ON notary.request_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON notary.pricing TO authenticated;

GRANT SELECT ON notary.service_types TO anon;
GRANT SELECT ON notary.notaries TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA notary TO authenticated;

GRANT EXECUTE ON FUNCTION notary.get_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION notary.get_available_notaries(TEXT, UUID) TO authenticated;

-- =====================================================
-- 17. REGISTRAR COMO APLICACIÓN
-- =====================================================

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
  'Servicios Notariales',
  'notary',
  'Gestión de servicios notariales con portal para notarías',
  'core',
  '1.0.0',
  true,
  false,
  jsonb_build_object(
    'auto_assign_notary', false,
    'notify_on_completion', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  default_config = EXCLUDED.default_config;

-- =====================================================
-- 18. COMENTARIOS
-- =====================================================

COMMENT ON SCHEMA notary IS 'Sistema de servicios notariales independiente con portal para notarías';

COMMENT ON TABLE notary.service_types IS 'Tipos de servicios notariales (Copia Certificada, Protocolización, FAN, etc.)';
COMMENT ON TABLE notary.notaries IS 'Notarías registradas con acceso a portal propio';
COMMENT ON TABLE notary.requests IS 'Solicitudes de servicios notariales - pueden venir de firma electrónica o ser independientes';
COMMENT ON TABLE notary.request_events IS 'Historial de eventos por solicitud';
COMMENT ON TABLE notary.pricing IS 'Precios personalizados por organización';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Schema Notary separado exitosamente';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas en notary:';
  RAISE NOTICE '  ✅ notary.service_types - Tipos de servicios';
  RAISE NOTICE '  ✅ notary.notaries - Notarías con portal';
  RAISE NOTICE '  ✅ notary.requests - Solicitudes independientes';
  RAISE NOTICE '  ✅ notary.request_events - Historial';
  RAISE NOTICE '  ✅ notary.pricing - Precios personalizados';
  RAISE NOTICE '';
  RAISE NOTICE 'Datos migrados desde signatures:';
  RAISE NOTICE '  - notary_service_types → notary.service_types';
  RAISE NOTICE '  - notaries → notary.notaries';
  RAISE NOTICE '  - notary_requests → notary.requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas eliminadas de signatures:';
  RAISE NOTICE '  - signatures.notary_service_types';
  RAISE NOTICE '  - signatures.notaries';
  RAISE NOTICE '  - signatures.notary_requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Nueva capacidad:';
  RAISE NOTICE '  - Solicitudes notariales SIN firma previa';
  RAISE NOTICE '  - Portal independiente para notarías';
  RAISE NOTICE '  - Servicios notariales como producto separado';
  RAISE NOTICE '';
END $$;
