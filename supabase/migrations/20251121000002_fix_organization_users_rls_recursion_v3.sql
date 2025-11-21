-- =====================================================
-- Migration: Fix Recursión Infinita en organization_users RLS (v3)
-- Description: Solución definitiva usando función auxiliar sin RLS
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- El problema es que SET LOCAL row_security = off no funciona correctamente
-- cuando se llama desde una política RLS. Necesitamos usar un enfoque diferente.

-- SOLUCIÓN: Crear una función auxiliar que consulte organization_users
-- usando SECURITY DEFINER y deshabilitando RLS de manera más efectiva.

-- =====================================================
-- PASO 1: CREAR FUNCIÓN AUXILIAR SIN RLS
-- =====================================================

-- Función auxiliar que consulta organization_users sin pasar por RLS
-- Usa SECURITY DEFINER para ejecutarse con privilegios del propietario de la función
CREATE OR REPLACE FUNCTION public._check_platform_admin_internal(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
  old_row_security TEXT;
BEGIN
  -- Guardar el valor actual de row_security
  SELECT current_setting('row_security', true) INTO old_row_security;
  
  -- Deshabilitar RLS temporalmente para esta función
  PERFORM set_config('row_security', 'off', false);
  
  -- Consultar organization_users sin pasar por RLS
  SELECT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.organizations o ON o.id = ou.organization_id
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = _check_platform_admin_internal.user_id
    AND o.org_type = 'platform'
    AND r.slug = 'platform_super_admin'
    AND ou.status = 'active'
  ) INTO result;
  
  -- Restaurar el valor anterior de row_security
  IF old_row_security IS NOT NULL THEN
    PERFORM set_config('row_security', old_row_security, false);
  END IF;
  
  RETURN COALESCE(result, false);
EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, restaurar row_security y relanzar el error
    IF old_row_security IS NOT NULL THEN
      PERFORM set_config('row_security', old_row_security, false);
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PASO 2: ACTUALIZAR is_platform_super_admin
-- =====================================================

-- Actualizar la función principal para usar la función auxiliar
CREATE OR REPLACE FUNCTION public.is_platform_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Usar la función auxiliar que deshabilita RLS correctamente
  RETURN public._check_platform_admin_internal(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION public._check_platform_admin_internal(UUID) IS 
'Función auxiliar interna que consulta organization_users sin pasar por RLS. Usa set_config para deshabilitar RLS de manera efectiva.';

COMMENT ON FUNCTION public.is_platform_super_admin(UUID) IS 
'Verifica si un usuario es platform super admin. Usa función auxiliar para evitar recursión en políticas RLS.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función is_platform_super_admin() actualizada para evitar recursión';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  1. ✅ Creada función auxiliar _check_platform_admin_internal()';
  RAISE NOTICE '  2. ✅ Función auxiliar usa set_config para deshabilitar RLS';
  RAISE NOTICE '  3. ✅ is_platform_super_admin() ahora usa la función auxiliar';
  RAISE NOTICE '';
  RAISE NOTICE 'Esto debería resolver el problema de recursión infinita';
END $$;

