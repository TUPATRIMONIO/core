-- Migration: Otorgar permisos GRANT al rol authenticated en schema marketing
-- Description: El rol authenticated necesita permisos para INSERT/UPDATE/DELETE en tablas de marketing
-- Created: 2025-10-25

-- =====================================================
-- OTORGAR PERMISOS COMPLETOS A AUTHENTICATED
-- =====================================================

-- Otorgar todos los permisos en tablas de marketing al rol authenticated
GRANT ALL ON marketing.blog_posts TO authenticated;
GRANT ALL ON marketing.blog_categories TO authenticated;
GRANT ALL ON marketing.faqs TO authenticated;
GRANT ALL ON marketing.testimonials TO authenticated;
GRANT ALL ON marketing.case_studies TO authenticated;
GRANT ALL ON marketing.newsletter_subscribers TO authenticated;
GRANT ALL ON marketing.contact_messages TO authenticated;
GRANT ALL ON marketing.waitlist_subscribers TO authenticated;

-- Otorgar uso de sequences (para auto-increment de IDs si aplica)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA marketing TO authenticated;

-- Asegurar que futuros objetos también tengan permisos
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
  GRANT ALL ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
  GRANT USAGE ON SEQUENCES TO authenticated;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON SCHEMA marketing IS 
'Schema de marketing con permisos completos para authenticated. RLS controla el acceso granular por fila.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Permisos GRANT otorgados exitosamente al rol authenticated';
  RAISE NOTICE 'ℹ️  Las políticas RLS controlan el acceso específico por usuario';
  RAISE NOTICE 'ℹ️  Platform admins pueden gestionar todo el contenido de marketing';
END $$;
