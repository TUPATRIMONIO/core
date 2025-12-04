-- =====================================================
-- Migration: Feature Flags RPC Wrappers
-- Description: Crea wrappers en public para funciones RPC de feature flags
-- Created: 2025-12-04
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- WRAPPERS EN PUBLIC
-- =====================================================

-- can_access_feature
CREATE OR REPLACE FUNCTION public.can_access_feature(
  p_feature_slug TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN core.can_access_feature(p_feature_slug, p_organization_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.can_access_feature(TEXT, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_feature(TEXT, UUID, UUID) TO service_role;

-- get_enabled_features
CREATE OR REPLACE FUNCTION public.get_enabled_features(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  slug TEXT,
  name TEXT,
  category core.feature_category,
  visibility_level core.visibility_level
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM core.get_enabled_features(p_organization_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_enabled_features(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_enabled_features(UUID, UUID) TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.can_access_feature IS 
'Wrapper para core.can_access_feature() - permite llamar desde Supabase RPC';

COMMENT ON FUNCTION public.get_enabled_features IS 
'Wrapper para core.get_enabled_features() - permite llamar desde Supabase RPC';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Wrappers RPC creados en public para feature flags';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones wrapper creadas:';
  RAISE NOTICE '  ✅ public.can_access_feature() → core.can_access_feature()';
  RAISE NOTICE '  ✅ public.get_enabled_features() → core.get_enabled_features()';
  RAISE NOTICE '';
  RAISE NOTICE 'Ahora Supabase RPC puede encontrar todas las funciones de feature flags';
END $$;





