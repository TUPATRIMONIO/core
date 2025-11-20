-- =====================================================
-- Migration: Funciones Helper para Gestión de Invitaciones
-- Description: Funciones para crear, enviar, aceptar y cancelar invitaciones
-- Created: 2025-11-20
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN: Enviar Invitación a Organización
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_organization_invitation(
  org_id UUID,
  invite_email TEXT,
  role_id UUID,
  invitation_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  invitation_token TEXT;
  invitation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Verificar que el usuario actual sea org owner o admin
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
    AND ou.user_id = current_user_id
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para enviar invitaciones en esta organización';
  END IF;
  
  -- Verificar que el email no sea de un usuario ya miembro
  IF EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.users u ON u.id = ou.user_id
    JOIN auth.users au ON au.id = u.id
    WHERE ou.organization_id = org_id
    AND au.email = invite_email
    AND ou.status = 'active'
  ) THEN
    RAISE EXCEPTION 'El usuario ya es miembro de esta organización';
  END IF;
  
  -- Verificar que no haya invitación pendiente para este email
  IF EXISTS (
    SELECT 1
    FROM core.invitations
    WHERE organization_id = org_id
    AND email = invite_email
    AND status = 'pending'
    AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'Ya existe una invitación pendiente para este email';
  END IF;
  
  -- Generar token único
  invitation_token := encode(gen_random_bytes(32), 'base64');
  
  -- Crear invitación
  INSERT INTO core.invitations (
    organization_id,
    role_id,
    email,
    token,
    status,
    invited_by,
    message,
    expires_at
  ) VALUES (
    org_id,
    role_id,
    invite_email,
    invitation_token,
    'pending',
    current_user_id,
    invitation_message,
    NOW() + INTERVAL '7 days'
  )
  RETURNING id INTO invitation_id;
  
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
    'invitation.sent',
    'info',
    format('Invitación enviada a %s', invite_email),
    current_user_id,
    'invitation',
    invitation_id,
    jsonb_build_object(
      'email', invite_email,
      'role_id', role_id,
      'expires_at', NOW() + INTERVAL '7 days'
    )
  );
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.send_organization_invitation(UUID, TEXT, UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION public.send_organization_invitation IS
'Crea y envía una invitación para unirse a una organización. Solo org owners/admins pueden invitar.';

-- =====================================================
-- 2. FUNCIÓN: Aceptar Invitación
-- =====================================================

CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT)
RETURNS UUID AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
  user_email TEXT;
  new_org_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Obtener email del usuario actual
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  -- Obtener invitación
  SELECT * INTO invitation_record
  FROM core.invitations
  WHERE token = invitation_token
  AND status = 'pending'
  AND email = user_email
  AND expires_at > NOW();
  
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Invitación no válida, expirada o no corresponde a tu email';
  END IF;
  
  -- Verificar que el usuario no sea ya miembro
  IF EXISTS (
    SELECT 1
    FROM core.organization_users
    WHERE organization_id = invitation_record.organization_id
    AND user_id = current_user_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Ya eres miembro de esta organización';
  END IF;
  
  -- Crear entrada en core.users si no existe
  INSERT INTO core.users (id, status)
  VALUES (current_user_id, 'active')
  ON CONFLICT (id) DO NOTHING;
  
  -- Agregar usuario a la organización
  INSERT INTO core.organization_users (
    organization_id,
    user_id,
    role_id,
    status,
    invited_by
  ) VALUES (
    invitation_record.organization_id,
    current_user_id,
    invitation_record.role_id,
    'active',
    invitation_record.invited_by
  )
  RETURNING id INTO new_org_user_id;
  
  -- Actualizar invitación
  UPDATE core.invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    accepted_by = current_user_id,
    updated_at = NOW()
  WHERE id = invitation_record.id;
  
  -- Actualizar last_active_organization del usuario
  UPDATE core.users
  SET last_active_organization_id = invitation_record.organization_id
  WHERE id = current_user_id;
  
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
    invitation_record.organization_id,
    'invitation.accepted',
    'info',
    format('Usuario %s aceptó invitación', user_email),
    current_user_id,
    'organization_user',
    new_org_user_id,
    jsonb_build_object(
      'invitation_id', invitation_record.id,
      'email', user_email,
      'role_id', invitation_record.role_id
    )
  );
  
  RETURN invitation_record.organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;

COMMENT ON FUNCTION public.accept_invitation IS
'Acepta una invitación pendiente usando el token. Agrega al usuario a la organización.';

-- =====================================================
-- 3. FUNCIÓN: Cancelar Invitación
-- =====================================================

CREATE OR REPLACE FUNCTION public.cancel_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invitation_record RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Obtener invitación
  SELECT * INTO invitation_record
  FROM core.invitations
  WHERE id = invitation_id;
  
  IF invitation_record IS NULL THEN
    RAISE EXCEPTION 'Invitación no encontrada';
  END IF;
  
  -- Verificar permisos (debe ser el que invitó, org admin o platform admin)
  IF NOT (
    invitation_record.invited_by = current_user_id
    OR
    EXISTS (
      SELECT 1
      FROM core.organization_users ou
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.organization_id = invitation_record.organization_id
      AND ou.user_id = current_user_id
      AND ou.status = 'active'
      AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
    )
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para cancelar esta invitación';
  END IF;
  
  -- Actualizar invitación
  UPDATE core.invitations
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = invitation_id;
  
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
    invitation_record.organization_id,
    'invitation.cancelled',
    'info',
    format('Invitación cancelada para %s', invitation_record.email),
    current_user_id,
    'invitation',
    invitation_id,
    jsonb_build_object(
      'email', invitation_record.email,
      'original_inviter', invitation_record.invited_by
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cancel_invitation(UUID) TO authenticated;

COMMENT ON FUNCTION public.cancel_invitation IS
'Cancela una invitación pendiente. Solo el que invitó u org admins pueden cancelar.';

-- =====================================================
-- 4. FUNCIÓN: Obtener Invitaciones Pendientes de una Org
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pending_invitations(org_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role_name TEXT,
  role_slug TEXT,
  invited_by_name TEXT,
  invited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  message TEXT
) AS $$
BEGIN
  -- Verificar permisos
  IF NOT EXISTS (
    SELECT 1
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.organization_id = org_id
    AND ou.user_id = auth.uid()
    AND ou.status = 'active'
    AND r.slug IN ('org_owner', 'org_admin', 'platform_super_admin')
  ) THEN
    RAISE EXCEPTION 'No tienes permisos para ver invitaciones de esta organización';
  END IF;
  
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    r.name as role_name,
    r.slug as role_slug,
    u.full_name as invited_by_name,
    i.invited_at,
    i.expires_at,
    i.message
  FROM core.invitations i
  JOIN core.roles r ON r.id = i.role_id
  LEFT JOIN core.users u ON u.id = i.invited_by
  WHERE i.organization_id = org_id
  AND i.status = 'pending'
  AND i.expires_at > NOW()
  ORDER BY i.invited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_pending_invitations(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_pending_invitations IS
'Lista todas las invitaciones pendientes de una organización. Solo para org admins.';

-- =====================================================
-- 5. FUNCIÓN: Obtener Invitaciones del Usuario por Email
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_invitations()
RETURNS TABLE (
  id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  role_name TEXT,
  role_description TEXT,
  invited_by_name TEXT,
  invited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  message TEXT,
  token TEXT
) AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obtener email del usuario actual
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;
  
  RETURN QUERY
  SELECT 
    i.id,
    o.name as organization_name,
    o.slug as organization_slug,
    r.name as role_name,
    r.description as role_description,
    u.full_name as invited_by_name,
    i.invited_at,
    i.expires_at,
    i.message,
    i.token
  FROM core.invitations i
  JOIN core.organizations o ON o.id = i.organization_id
  JOIN core.roles r ON r.id = i.role_id
  LEFT JOIN core.users u ON u.id = i.invited_by
  WHERE i.email = user_email
  AND i.status = 'pending'
  AND i.expires_at > NOW()
  ORDER BY i.invited_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_user_invitations() TO authenticated;

COMMENT ON FUNCTION public.get_user_invitations IS
'Obtiene todas las invitaciones pendientes para el email del usuario actual.';

-- =====================================================
-- 6. TRIGGER: Expirar Invitaciones Automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION core.expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE core.invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Esta función debería ejecutarse periódicamente vía pg_cron o similar
-- Por ahora, se puede llamar manualmente o desde la aplicación

COMMENT ON FUNCTION core.expire_old_invitations IS
'Marca invitaciones pendientes como expiradas si pasaron su fecha de expiración. Ejecutar periódicamente.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones helper de invitaciones creadas exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones disponibles:';
  RAISE NOTICE '  ✅ send_organization_invitation() - Enviar invitación';
  RAISE NOTICE '  ✅ accept_invitation() - Aceptar invitación con token';
  RAISE NOTICE '  ✅ cancel_invitation() - Cancelar invitación pendiente';
  RAISE NOTICE '  ✅ get_pending_invitations() - Listar invitaciones de org';
  RAISE NOTICE '  ✅ get_user_invitations() - Ver invitaciones del usuario';
  RAISE NOTICE '  ✅ expire_old_invitations() - Expirar invitaciones antiguas';
  RAISE NOTICE '';
  RAISE NOTICE 'Flujo de invitación:';
  RAISE NOTICE '  1. Org admin llama send_organization_invitation()';
  RAISE NOTICE '  2. Usuario recibe email con token';
  RAISE NOTICE '  3. Usuario llama accept_invitation(token)';
  RAISE NOTICE '  4. Usuario es agregado a la organización';
  RAISE NOTICE '';
  RAISE NOTICE 'Seguridad:';
  RAISE NOTICE '  - Solo org owners/admins pueden enviar invitaciones';
  RAISE NOTICE '  - Invitaciones expiran en 7 días';
  RAISE NOTICE '  - Token único y seguro por invitación';
  RAISE NOTICE '  - Validación de email del usuario';
  RAISE NOTICE '  - Eventos de auditoría registrados';
END $$;

