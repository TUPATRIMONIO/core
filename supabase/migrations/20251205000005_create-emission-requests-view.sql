-- =====================================================
-- Migration: Create public view for emission_requests
-- Description: Vista pública para acceder a invoicing.emission_requests
-- Created: 2025-12-05
-- =====================================================

SET search_path TO invoicing, billing, credits, core, public, extensions;

-- =====================================================
-- VIEW: Emission Requests (para acceso desde la API)
-- =====================================================

CREATE OR REPLACE VIEW public.emission_requests AS
SELECT 
  er.id,
  er.organization_id,
  er.document_id,
  er.status,
  er.attempts,
  er.max_attempts,
  er.last_error,
  er.last_error_at,
  er.request_data,
  er.created_at,
  er.updated_at,
  er.processed_at,
  er.completed_at
FROM invoicing.emission_requests er;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant SELECT, UPDATE a service_role (para el processor)
GRANT SELECT, UPDATE, INSERT ON public.emission_requests TO service_role;
GRANT SELECT ON public.emission_requests TO authenticated;

-- =====================================================
-- RULES para permitir operaciones a través de la vista
-- =====================================================

-- Rule para INSERT
CREATE OR REPLACE RULE emission_requests_insert AS
ON INSERT TO public.emission_requests
DO INSTEAD
INSERT INTO invoicing.emission_requests (
  organization_id,
  document_id,
  status,
  attempts,
  max_attempts,
  last_error,
  last_error_at,
  request_data,
  processed_at,
  completed_at
) VALUES (
  NEW.organization_id,
  NEW.document_id,
  NEW.status,
  COALESCE(NEW.attempts, 0),
  COALESCE(NEW.max_attempts, 3),
  NEW.last_error,
  NEW.last_error_at,
  NEW.request_data,
  NEW.processed_at,
  NEW.completed_at
) RETURNING *;

-- Rule para UPDATE
CREATE OR REPLACE RULE emission_requests_update AS
ON UPDATE TO public.emission_requests
DO INSTEAD
UPDATE invoicing.emission_requests
SET
  document_id = NEW.document_id,
  status = NEW.status,
  attempts = NEW.attempts,
  max_attempts = NEW.max_attempts,
  last_error = NEW.last_error,
  last_error_at = NEW.last_error_at,
  request_data = NEW.request_data,
  updated_at = NOW(),
  processed_at = NEW.processed_at,
  completed_at = NEW.completed_at
WHERE id = OLD.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON VIEW public.emission_requests IS 
'Vista pública para acceder a invoicing.emission_requests desde la API';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista public.emission_requests creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos:';
  RAISE NOTICE '  ✅ SELECT, UPDATE, INSERT para service_role';
  RAISE NOTICE '  ✅ SELECT para authenticated';
  RAISE NOTICE '';
  RAISE NOTICE 'Rules:';
  RAISE NOTICE '  ✅ INSERT redirects to invoicing.emission_requests';
  RAISE NOTICE '  ✅ UPDATE redirects to invoicing.emission_requests';
END $$;







