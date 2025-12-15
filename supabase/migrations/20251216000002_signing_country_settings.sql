-- =====================================================
-- Migration: Signing country settings (AI availability)
-- Description: Configuración por país para habilitar/deshabilitar revisión por IA
-- Created: 2025-12-16
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- =====================================================
-- TABLE: signing.country_settings
-- =====================================================

CREATE TABLE IF NOT EXISTS signing.country_settings (
  country_code TEXT PRIMARY KEY CHECK (length(country_code) = 2),

  ai_analysis_available BOOLEAN NOT NULL DEFAULT false,
  ai_analysis_message TEXT,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_country_settings_updated_at ON signing.country_settings;
CREATE TRIGGER update_country_settings_updated_at
  BEFORE UPDATE ON signing.country_settings
  FOR EACH ROW EXECUTE FUNCTION signing.update_updated_at();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE signing.country_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view signing country settings" ON signing.country_settings;
CREATE POLICY "Anyone can view signing country settings"
ON signing.country_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Platform admins can manage signing country settings" ON signing.country_settings;
CREATE POLICY "Platform admins can manage signing country settings"
ON signing.country_settings FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND o.org_type = 'platform'
      AND r.level >= 9
  )
);

GRANT SELECT ON signing.country_settings TO anon, authenticated;
GRANT ALL ON signing.country_settings TO service_role;

-- =====================================================
-- Public view
-- =====================================================

CREATE OR REPLACE VIEW public.signing_country_settings AS
SELECT country_code, ai_analysis_available, ai_analysis_message
FROM signing.country_settings;

GRANT SELECT ON public.signing_country_settings TO anon, authenticated;
ALTER VIEW public.signing_country_settings SET (security_invoker = true);

-- =====================================================
-- Seed
-- =====================================================

INSERT INTO signing.country_settings (country_code, ai_analysis_available, ai_analysis_message)
VALUES
  ('CL', true, 'Revisión por IA disponible para Chile.'),
  ('AR', false, null),
  ('CO', false, null),
  ('MX', false, null),
  ('PE', false, null),
  ('US', false, null)
ON CONFLICT (country_code) DO UPDATE SET
  ai_analysis_available = EXCLUDED.ai_analysis_available,
  ai_analysis_message = EXCLUDED.ai_analysis_message,
  updated_at = NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ signing.country_settings creado + vista pública + seed aplicado';
END $$;



