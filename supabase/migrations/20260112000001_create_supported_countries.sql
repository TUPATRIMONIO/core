-- =====================================================
-- Migration: Create supported countries table
-- Description: Tabla centralizada que define la relación fija país-moneda
-- Created: 2026-01-12
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- TABLE: core.supported_countries
-- =====================================================

CREATE TABLE IF NOT EXISTS core.supported_countries (
  country_code TEXT PRIMARY KEY CHECK (length(country_code) = 2),
  name TEXT NOT NULL CHECK (length(name) >= 2),
  currency_code TEXT NOT NULL CHECK (length(currency_code) = 3),
  flag_emoji TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: currency_code debe ser válido
  CONSTRAINT valid_currency_code CHECK (currency_code ~ '^[A-Z]{3}$')
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_supported_countries_active ON core.supported_countries(is_active, display_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supported_countries_currency ON core.supported_countries(currency_code);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION core.update_supported_countries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_supported_countries_updated_at ON core.supported_countries;
CREATE TRIGGER update_supported_countries_updated_at
  BEFORE UPDATE ON core.supported_countries
  FOR EACH ROW
  EXECUTE FUNCTION core.update_supported_countries_updated_at();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE core.supported_countries ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver países activos
DROP POLICY IF EXISTS "Anyone can view active supported countries" ON core.supported_countries;
CREATE POLICY "Anyone can view active supported countries"
ON core.supported_countries FOR SELECT
USING (is_active = true);

-- Platform admins pueden gestionar países
DROP POLICY IF EXISTS "Platform admins can manage supported countries" ON core.supported_countries;
CREATE POLICY "Platform admins can manage supported countries"
ON core.supported_countries FOR ALL
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

GRANT SELECT ON core.supported_countries TO anon, authenticated;
GRANT ALL ON core.supported_countries TO service_role;

-- =====================================================
-- PUBLIC VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.supported_countries AS
SELECT 
  country_code,
  name,
  currency_code,
  flag_emoji,
  is_active,
  display_order
FROM core.supported_countries
WHERE is_active = true
ORDER BY display_order, name;

GRANT SELECT ON public.supported_countries TO anon, authenticated;
ALTER VIEW public.supported_countries SET (security_invoker = true);

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO core.supported_countries (
  country_code,
  name,
  currency_code,
  flag_emoji,
  is_active,
  display_order
) VALUES
  ('CL', 'Chile', 'CLP', '🇨🇱', true, 10),
  ('AR', 'Argentina', 'ARS', '🇦🇷', true, 20),
  ('CO', 'Colombia', 'COP', '🇨🇴', true, 30),
  ('MX', 'México', 'MXN', '🇲🇽', true, 40),
  ('PE', 'Perú', 'PEN', '🇵🇪', true, 50),
  ('BR', 'Brasil', 'BRL', '🇧🇷', true, 60),
  ('US', 'Estados Unidos', 'USD', '🇺🇸', true, 70)
ON CONFLICT (country_code) DO UPDATE SET
  name = EXCLUDED.name,
  currency_code = EXCLUDED.currency_code,
  flag_emoji = EXCLUDED.flag_emoji,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- =====================================================
-- FUNCTION: Get currency for country
-- =====================================================

CREATE OR REPLACE FUNCTION core.get_currency_for_country(country_code_param TEXT)
RETURNS TEXT AS $$
DECLARE
  v_currency TEXT;
BEGIN
  SELECT currency_code INTO v_currency
  FROM core.supported_countries
  WHERE country_code = UPPER(country_code_param)
    AND is_active = true;
  
  RETURN COALESCE(v_currency, 'USD'); -- Fallback a USD si no se encuentra
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION core.get_currency_for_country(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION core.get_currency_for_country IS 'Obtiene el código de moneda para un país. Retorna USD como fallback si el país no está soportado.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ core.supported_countries creada exitosamente';
  RAISE NOTICE '   - 7 países configurados con sus monedas';
  RAISE NOTICE '   - Vista pública creada';
  RAISE NOTICE '   - Función get_currency_for_country() creada';
END $$;
