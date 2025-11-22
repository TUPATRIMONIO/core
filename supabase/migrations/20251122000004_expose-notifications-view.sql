-- =====================================================
-- Migration: Expose Notifications View
-- Description: Crea vista pública para notificaciones
-- Created: 2025-11-22
-- =====================================================

SET search_path TO core, public, extensions;

-- =====================================================
-- CREATE PUBLIC VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.notifications AS 
SELECT * FROM core.notifications;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- =====================================================
-- RLS ON VIEW
-- =====================================================

ALTER VIEW public.notifications SET (security_invoker = true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista pública de notificaciones creada';
END $$;

