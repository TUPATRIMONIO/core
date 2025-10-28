-- ================================
-- Función de Acceso Admin
-- ================================
-- Función RPC para verificar si un usuario puede acceder al panel de administración
-- Usa SECURITY DEFINER para bypasear las políticas RLS y acceder directamente a marketing.user_roles

CREATE OR REPLACE FUNCTION can_access_admin(user_id uuid)
RETURNS boolean AS $$
DECLARE
    user_role text;
BEGIN
    -- Obtener rol del usuario desde la tabla marketing.user_roles
    SELECT role INTO user_role
    FROM marketing.user_roles 
    WHERE marketing.user_roles.user_id = can_access_admin.user_id;
    
    -- Si no tiene rol asignado, no tiene acceso
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar si tiene rol de administrador, super admin o editor
    RETURN user_role IN ('admin', 'super_admin', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a usuarios autenticados y anónimos
GRANT EXECUTE ON FUNCTION can_access_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_admin(uuid) TO anon;

-- Comentario para documentación
COMMENT ON FUNCTION can_access_admin IS 'Verifica si un usuario tiene permisos para acceder al panel de administración. Retorna TRUE si el usuario tiene rol de admin, super_admin o editor.';

