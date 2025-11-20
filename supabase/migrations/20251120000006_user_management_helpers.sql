-- =====================================================
-- Migration: Funciones Helper para Gestión de Usuarios y Roles
-- Description: Funciones para asignar roles, gestionar usuarios en organizaciones
-- Created: 2025-11-20
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN: Asignar Rol a Usuario en Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.assign_role_to_user(
  org_id UUID,
  target_user_id UUID,
  new_role_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_user_level INTEGER;
  target_role_level INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar permisos del usuario actual (debe ser org owner/admin o platform admin)
  SELECT r.level INTO current_user_level
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.organization_id = org_id
  AND ou.user_id = current_user_id
  AND ou.status = 'active'
  AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
  ORDER BY r.level DESC
  LIMIT 1;
  
  IF current_user_level IS NULL THEN
    RAISE EXCEPTION 'No tienes permisos para asignar roles en esta organización';
  END IF;
  
  -- Obtener nivel del rol que se quiere asignar
  SELECT level INTO target_role_level
  FROM core.roles
  WHERE id = new_role_id;
  
  IF target_role_level IS NULL THEN
    RAISE EXCEPTION 'Rol no encontrado';
  END IF;
  
  -- Verificar que el usuario actual tenga nivel suficiente para asignar este rol
  -- (no se puede asignar un rol de nivel igual o superior al propio)
  IF target_role_level >= current_user_level AND current_user_level < 10 THEN
    RAISE EXCEPTION 'No puedes asignar un rol de nivel igual o superior al tuyo';
  END IF;
  
  -- Verificar que el usuario target exista en la organización
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = org_id
    AND user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'El usuario no es miembro de esta organización';
  END IF;
  
  -- Actualizar rol del usuario
  UPDATE core.organization_users
  SET 
    role_id = new_role_id,
    updated_at = NOW()
  WHERE organization_id = org_id
  AND user_id = target_user_id;
  
  -- Registrar evento
  INSERT INTO core.system_events (
    organization_id,
    event_type,
    event_level,
    message,
    user_id,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    org_id,
    'user.role_changed',
    'info',
    format('Rol cambiado para usuario'),
    current_user_id,
    'organization_user',
    target_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'new_role_id', new_role_id,
      'changed_by', current_user_id
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.assign_role_to_user(UUID, UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.assign_role_to_user IS
'Asigna un nuevo rol a un usuario en una organización. Solo org owners/admins pueden asignar roles.';

-- =====================================================
-- 2. FUNCIÓN: Remover Usuario de Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.remove_user_from_organization(
  org_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_user_level INTEGER;
  target_user_level INTEGER;
  owners_count INTEGER;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar permisos del usuario actual
  SELECT r.level INTO current_user_level
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.organization_id = org_id
  AND ou.user_id = current_user_id
  AND ou.status = 'active'
  AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
  ORDER BY r.level DESC
  LIMIT 1;
  
  IF current_user_level IS NULL THEN
    RAISE EXCEPTION 'No tienes permisos para remover usuarios de esta organización';
  END IF;
  
  -- Obtener nivel del usuario target
  SELECT r.level INTO target_user_level
  FROM core.organization_users ou
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.organization_id = org_id
  AND ou.user_id = target_user_id
  AND ou.status = 'active';
  
  IF target_user_level IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado o ya inactivo';
  END IF;
  
  -- Verificar que no se pueda remover a alguien de nivel igual o superior
  IF target_user_level >= current_user_level AND current_user_level < 10 THEN
    RAISE EXCEPTION 'No puedes remover un usuario de nivel igual o superior al tuyo';
  END IF;
  
  -- Verificar que no sea el último owner
  IF EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
    AND ou.user_id = target_user_id
    AND r.slug = 'org_owner'
  ) THEN
    SELECT COUNT(*) INTO owners_count
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
    AND r.slug = 'org_owner'
    AND ou.status = 'active';
    
    IF owners_count <= 1 THEN
      RAISE EXCEPTION 'No puedes remover al último owner de la organización';
    END IF;
  END IF;
  
  -- Marcar usuario como inactivo (soft delete)
  UPDATE core.organization_users
  SET 
    status = 'inactive',
    updated_at = NOW()
  WHERE organization_id = org_id
  AND user_id = target_user_id;
  
  -- Registrar evento
  INSERT INTO core.system_events (
    organization_id,
    event_type,
    event_level,
    message,
    user_id,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    org_id,
    'user.removed',
    'warning',
    format('Usuario removido de la organización'),
    current_user_id,
    'organization_user',
    target_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'removed_by', current_user_id
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_user_from_organization(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.remove_user_from_organization IS
'Remueve un usuario de una organización (soft delete). No se puede remover al último owner.';

-- =====================================================
-- 3. FUNCIÓN: Cambiar Organización Activa
-- =====================================================

CREATE OR REPLACE FUNCTION public.switch_active_organization(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar que el usuario sea miembro activo de esta organización
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = org_id
    AND user_id = current_user_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No eres miembro activo de esta organización';
  END IF;
  
  -- Actualizar last_active_organization_id
  UPDATE core.users
  SET 
    last_active_organization_id = org_id,
    updated_at = NOW()
  WHERE id = current_user_id;
  
  -- Registrar evento
  INSERT INTO core.system_events (
    organization_id,
    event_type,
    event_level,
    message,
    user_id,
    metadata
  ) VALUES (
    org_id,
    'user.switched_organization',
    'info',
    format('Usuario cambió a esta organización'),
    current_user_id,
    jsonb_build_object(
      'previous_org_id', (SELECT last_active_organization_id FROM core.users WHERE id = current_user_id)
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.switch_active_organization(UUID) TO authenticated;

COMMENT ON FUNCTION public.switch_active_organization IS
'Cambia la organización activa del usuario actual. Solo puede cambiar a orgs donde es miembro activo.';

-- =====================================================
-- 4. FUNCIÓN: Obtener Miembros de Organización con Roles
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_organization_members(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role_id UUID,
  role_name TEXT,
  role_slug TEXT,
  role_level INTEGER,
  status TEXT,
  joined_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verificar que el usuario actual sea miembro de la organización
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para ver los miembros de esta organización';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    au.email,
    u.full_name,
    u.avatar_url,
    r.id as role_id,
    r.name as role_name,
    r.slug as role_slug,
    r.level as role_level,
    ou.status::TEXT,
    ou.joined_at,
    u.last_seen_at
  FROM core.organization_users ou
  JOIN core.users u ON u.id = ou.user_id
  JOIN auth.users au ON au.id = u.id
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.organization_id = org_id
  ORDER BY r.level DESC, u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_organization_members(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_organization_members IS
'Lista todos los miembros de una organización con sus roles. Accesible para cualquier miembro de la org.';

-- =====================================================
-- 5. FUNCIÓN: Verificar Permisos Específicos del Usuario
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_user_permission(
  org_id UUID,
  permission_key TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Usar la función user_has_permission existente
  SELECT public.user_has_permission(auth.uid(), org_id, permission_key)
  INTO has_permission;
  
  RETURN COALESCE(has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_user_permission(UUID, TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.check_user_permission IS
'Verifica si el usuario actual tiene un permiso específico en una organización. Wrapper de user_has_permission.';

-- =====================================================
-- 6. FUNCIÓN: Obtener Usuarios por Rol en Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_users_by_role(
  org_id UUID,
  role_slug TEXT
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Verificar que el usuario actual sea miembro de la organización
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para ver los miembros de esta organización';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    au.email,
    u.full_name,
    u.avatar_url,
    ou.status::TEXT,
    ou.joined_at
  FROM core.organization_users ou
  JOIN core.users u ON u.id = ou.user_id
  JOIN auth.users au ON au.id = u.id
  JOIN core.roles r ON r.id = ou.role_id
  WHERE ou.organization_id = org_id
  AND r.slug = role_slug
  ORDER BY u.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_users_by_role(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_users_by_role IS
'Obtiene todos los usuarios con un rol específico en una organización.';

-- =====================================================
-- 7. FUNCIÓN: Reactivar Usuario en Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.reactivate_user_in_organization(
  org_id UUID,
  target_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar permisos (debe ser org owner/admin o platform admin)
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
    AND ou.user_id = current_user_id
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para reactivar usuarios en esta organización';
  END IF;
  
  -- Verificar que el usuario esté inactivo
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = org_id
    AND user_id = target_user_id
    AND status = 'inactive'
  ) THEN
    RAISE EXCEPTION 'Usuario no encontrado o ya está activo';
  END IF;
  
  -- Reactivar usuario
  UPDATE core.organization_users
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE organization_id = org_id
  AND user_id = target_user_id;
  
  -- Registrar evento
  INSERT INTO core.system_events (
    organization_id,
    event_type,
    event_level,
    message,
    user_id,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    org_id,
    'user.reactivated',
    'info',
    format('Usuario reactivado en la organización'),
    current_user_id,
    'organization_user',
    target_user_id,
    jsonb_build_object(
      'target_user_id', target_user_id,
      'reactivated_by', current_user_id
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reactivate_user_in_organization(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.reactivate_user_in_organization IS
'Reactiva un usuario previamente removido de una organización. Solo org owners/admins.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones helper de gestión de usuarios creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  ✅ assign_role_to_user() - Asignar rol a usuario';
  RAISE NOTICE '  ✅ remove_user_from_organization() - Remover usuario';
  RAISE NOTICE '  ✅ switch_active_organization() - Cambiar org activa';
  RAISE NOTICE '  ✅ get_organization_members() - Listar miembros con roles';
  RAISE NOTICE '  ✅ check_user_permission() - Verificar permiso específico';
  RAISE NOTICE '  ✅ get_users_by_role() - Obtener usuarios por rol';
  RAISE NOTICE '  ✅ reactivate_user_in_organization() - Reactivar usuario';
  RAISE NOTICE '';
  RAISE NOTICE 'Flujos principales:';
  RAISE NOTICE '  1. Gestión de Roles: assign_role_to_user()';
  RAISE NOTICE '  2. Gestión de Miembros: remove/reactivate_user';
  RAISE NOTICE '  3. Navegación: switch_active_organization()';
  RAISE NOTICE '  4. Consultas: get_organization_members(), get_users_by_role()';
  RAISE NOTICE '';
  RAISE NOTICE 'Seguridad:';
  RAISE NOTICE '  - Solo org owners/admins pueden gestionar usuarios';
  RAISE NOTICE '  - No se puede asignar roles de nivel superior al propio';
  RAISE NOTICE '  - No se puede remover al último owner';
  RAISE NOTICE '  - Todos los cambios generan eventos de auditoría';
END $$;

