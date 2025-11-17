-- =====================================================
-- FIX: Permisos del Schema CORE para authenticated
-- =====================================================
-- Problema: El rol authenticated no puede acceder al schema core
-- Solución: Otorgar permisos necesarios

-- 1. Permitir uso del schema core
GRANT USAGE ON SCHEMA core TO authenticated;

-- 2. Otorgar SELECT en tablas principales
GRANT SELECT ON core.organizations TO authenticated;
GRANT SELECT ON core.organization_users TO authenticated;
GRANT SELECT ON core.roles TO authenticated;
GRANT SELECT ON core.applications TO authenticated;
GRANT SELECT ON core.organization_applications TO authenticated;

-- 3. Otorgar SELECT y UPDATE en users (necesario para last_active_organization_id)
GRANT SELECT, UPDATE ON core.users TO authenticated;

-- 4. Comentarios
COMMENT ON SCHEMA core IS 'Schema principal para organizaciones y usuarios multitenant';



