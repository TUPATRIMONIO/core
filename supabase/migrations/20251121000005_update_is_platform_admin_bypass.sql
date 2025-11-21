-- =====================================================
-- Migration: Actualizar is_platform_admin para usar tabla de bypass
-- Description: Actualizar la función is_platform_admin() para evitar recursión
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA
-- =====================================================
-- La función is_platform_admin() (sin "super") también consulta organization_users
-- y causa recursión. Necesita usar la tabla de bypass también.

-- =====================================================
-- ACTUALIZAR FUNCIÓN is_platform_admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar tabla auxiliar sin RLS para evitar recursión
  RETURN EXISTS (
    SELECT 1
    FROM _bypass.platform_admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- COMENTARIO
-- =====================================================

COMMENT ON FUNCTION public.is_platform_admin() IS 
'Verifica si el usuario actual es platform admin usando tabla auxiliar sin RLS. Evita recursión infinita.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función is_platform_admin() actualizada para usar tabla de bypass';
  RAISE NOTICE 'Ahora is_platform_admin() NO causa recursión infinita';
END $$;

