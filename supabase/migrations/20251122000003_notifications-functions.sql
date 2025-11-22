-- =====================================================
-- Migration: Notifications Functions
-- Description: Funciones para crear y gestionar notificaciones
-- Created: 2025-11-22
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- FUNCTION: create_notification
-- Description: Crea una notificación para una organización o usuario específico
-- =====================================================

CREATE OR REPLACE FUNCTION core.create_notification(
  org_id UUID,
  notification_type core.notification_type,
  title_param TEXT,
  message_param TEXT,
  user_id_param UUID DEFAULT NULL,
  action_url_param TEXT DEFAULT NULL,
  action_label_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO core.notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    metadata
  ) VALUES (
    org_id,
    user_id_param,
    notification_type,
    title_param,
    message_param,
    action_url_param,
    action_label_param,
    metadata_param
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: mark_notification_read
-- Description: Marca una notificación como leída
-- =====================================================

CREATE OR REPLACE FUNCTION core.mark_notification_read(
  notification_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  notification_record core.notifications%ROWTYPE;
BEGIN
  -- Get notification
  SELECT * INTO notification_record
  FROM core.notifications
  WHERE id = notification_id_param
  AND (
    user_id IS NULL OR
    user_id = user_id_param
  )
  AND organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = user_id_param 
    AND status = 'active'
  )
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found or access denied';
  END IF;
  
  -- Update status
  UPDATE core.notifications
  SET status = 'read',
      read_at = NOW()
  WHERE id = notification_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: mark_all_notifications_read
-- Description: Marca todas las notificaciones de un usuario como leídas
-- =====================================================

CREATE OR REPLACE FUNCTION core.mark_all_notifications_read(
  org_id_param UUID,
  user_id_param UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE core.notifications
  SET status = 'read',
      read_at = NOW()
  WHERE organization_id = org_id_param
  AND (
    user_id IS NULL OR
    user_id = user_id_param
  )
  AND status = 'unread'
  AND organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = user_id_param 
    AND status = 'active'
  );
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EXPOSE FUNCTIONS IN PUBLIC SCHEMA
-- =====================================================

-- create_notification
CREATE OR REPLACE FUNCTION public.create_notification(
  org_id_param UUID,
  notification_type_param TEXT,
  title_param TEXT,
  message_param TEXT,
  user_id_param UUID DEFAULT NULL,
  action_url_param TEXT DEFAULT NULL,
  action_label_param TEXT DEFAULT NULL,
  metadata_param JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
BEGIN
  RETURN core.create_notification(
    org_id_param,
    notification_type_param::core.notification_type,
    title_param,
    message_param,
    user_id_param,
    action_url_param,
    action_label_param,
    metadata_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- mark_notification_read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
  notification_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN core.mark_notification_read(notification_id_param, user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- mark_all_notifications_read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(
  org_id_param UUID,
  user_id_param UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN core.mark_all_notifications_read(org_id_param, user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de notificaciones creadas';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ create_notification';
  RAISE NOTICE '  ✅ mark_notification_read';
  RAISE NOTICE '  ✅ mark_all_notifications_read';
END $$;

