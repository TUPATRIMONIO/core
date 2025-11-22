-- =====================================================
-- Migration: Notifications RLS Policies
-- Description: Políticas de seguridad para notificaciones
-- Created: 2025-11-22
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES
-- =====================================================

-- Users can view notifications for their organizations
CREATE POLICY "Users can view own org notifications"
ON core.notifications
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
  AND (
    user_id IS NULL OR -- Notificación para toda la organización
    user_id = auth.uid() -- Notificación específica para el usuario
  )
);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update own notifications"
ON core.notifications
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
  AND (
    user_id IS NULL OR
    user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Service role can insert notifications (for webhooks, etc.)
-- This is handled by service role client, no policy needed

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS policies creadas para notifications';
END $$;

