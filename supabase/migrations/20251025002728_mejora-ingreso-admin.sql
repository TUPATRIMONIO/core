-- Migration: Crear función is_platform_admin en schema public
-- Description: La función debe estar en el schema public para que sea accesible desde el cliente de Supabase
-- Created: 2025-10-25

-- =====================================================
-- FUNCIÓN is_platform_admin EN SCHEMA PUBLIC
-- =====================================================

-- Crear la función en el schema public (necesario para RPC calls desde el cliente)
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Si no hay usuario autenticado, no es admin
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Verificar si el usuario actual pertenece a la org platform con rol admin
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid()
      AND o.org_type = 'platform'
      AND r.slug IN ('platform_super_admin', 'marketing_admin')
      AND ou.status = 'active'
  ) INTO is_admin;
  
  RETURN COALESCE(is_admin, false);
END;
$$;

COMMENT ON FUNCTION public.is_platform_admin() IS 
'Verifica si el usuario actual es admin de plataforma. Debe estar en schema public para ser accesible desde RPC calls del cliente Supabase.';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Permitir que usuarios autenticados ejecuten la función
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función is_platform_admin() creada en schema public exitosamente';
  RAISE NOTICE 'ℹ️  Ahora el cliente de Supabase puede llamar a esta función vía RPC';
END $$;

