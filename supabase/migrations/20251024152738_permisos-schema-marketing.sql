-- Dar permisos a roles públicos para acceder al schema marketing
-- Esta migración soluciona el error "permission denied for schema marketing"

-- Otorgar USAGE en el schema marketing a roles públicos
GRANT USAGE ON SCHEMA marketing TO anon;
GRANT USAGE ON SCHEMA marketing TO authenticated;

-- Otorgar permisos de SELECT en todas las tablas del schema marketing
-- Esto permite lectura de contenido publicado
GRANT SELECT ON ALL TABLES IN SCHEMA marketing TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA marketing TO authenticated;

-- Otorgar permisos de INSERT en tablas que permiten escritura pública
-- Estas tablas ya tienen políticas RLS que controlan el acceso
GRANT INSERT ON marketing.waitlist_subscribers TO anon;
GRANT INSERT ON marketing.contact_messages TO anon;
GRANT INSERT ON marketing.newsletter_subscribers TO anon;

-- Asegurar que futuros objetos también tengan permisos
-- Cualquier nueva tabla creada en marketing tendrá permisos automáticos
ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA marketing 
  GRANT SELECT ON TABLES TO authenticated;

-- Dar permisos en las sequences (para auto-increment si aplica)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA marketing TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA marketing TO authenticated;

-- Comentario explicativo
COMMENT ON SCHEMA marketing IS 'Schema de marketing con permisos públicos para lectura de contenido publicado. RLS controla el acceso granular por fila.';

-- Log de aplicación exitosa
DO $$ 
BEGIN 
  RAISE NOTICE 'Permisos del schema marketing otorgados correctamente a anon y authenticated';
END $$;

