-- ================================
-- Fix: Dependencia Circular en Políticas RLS
-- ================================
-- Problema: Las políticas de page_management y user_roles se referencian mutuamente
-- causando que las consultas fallen porque no pueden verificar permisos.
-- 
-- Solución: Crear función helper con SECURITY DEFINER que bypasea RLS
-- para verificar si un usuario es admin sin caer en ciclo infinito.

-- ================================
-- Función Helper para Verificar Admin
-- ================================

CREATE OR REPLACE FUNCTION marketing.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
    user_role_value text;
BEGIN
    -- Si no hay usuario, no es admin
    IF check_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Consultar rol directamente (SECURITY DEFINER bypasea RLS)
    SELECT role INTO user_role_value
    FROM marketing.user_roles
    WHERE user_id = check_user_id;
    
    -- Si no tiene rol asignado, no es admin
    IF user_role_value IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar si es admin o super_admin
    RETURN user_role_value IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para documentación
COMMENT ON FUNCTION marketing.is_admin IS 
'Verifica si un usuario tiene rol de admin o super_admin. 
Usa SECURITY DEFINER para bypasear RLS y evitar dependencia circular.';

-- ================================
-- Función Helper para Verificar Editor o Admin
-- ================================

CREATE OR REPLACE FUNCTION marketing.is_editor_or_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
DECLARE
    user_role_value text;
BEGIN
    IF check_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    SELECT role INTO user_role_value
    FROM marketing.user_roles
    WHERE user_id = check_user_id;
    
    IF user_role_value IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN user_role_value IN ('editor', 'admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION marketing.is_editor_or_admin IS 
'Verifica si un usuario tiene rol de editor, admin o super_admin.';

-- ================================
-- Recrear Políticas RLS usando las funciones helper
-- ================================

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "page_management_admin_all" ON marketing.page_management;
DROP POLICY IF EXISTS "page_management_editor_access" ON marketing.page_management;
DROP POLICY IF EXISTS "user_roles_admin_only" ON marketing.user_roles;

-- Política para page_management: Admin tiene acceso completo
CREATE POLICY "page_management_admin_all" ON marketing.page_management
    FOR ALL 
    USING (marketing.is_admin());

-- Política para page_management: Editor puede leer
CREATE POLICY "page_management_editor_read" ON marketing.page_management
    FOR SELECT 
    USING (marketing.is_editor_or_admin());

-- Política para user_roles: Solo admins pueden gestionar roles
CREATE POLICY "user_roles_admin_only" ON marketing.user_roles
    FOR ALL 
    USING (marketing.is_admin());

-- ================================
-- Otorgar Permisos de Ejecución
-- ================================

GRANT EXECUTE ON FUNCTION marketing.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION marketing.is_editor_or_admin(uuid) TO authenticated, anon;

-- ================================
-- Mensaje de Confirmación
-- ================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Migración aplicada: Dependencia circular en RLS corregida';
  RAISE NOTICE 'ℹ️  Funciones helper creadas: marketing.is_admin() y marketing.is_editor_or_admin()';
  RAISE NOTICE 'ℹ️  Políticas RLS actualizadas para page_management y user_roles';
END $$;

