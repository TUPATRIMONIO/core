-- =====================================================
-- Script de Verificación: Variables PostgreSQL
-- Descripción: Verifica que las variables app.settings.* estén configuradas
-- Uso: Ejecutar en SQL Editor de Supabase Dashboard
-- =====================================================

-- Verificar configuración actual
SELECT 
  current_setting('app.settings.supabase_url', true) as supabase_url,
  current_setting('app.settings.public_app_url', true) as public_app_url,
  CASE 
    WHEN current_setting('app.settings.supabase_service_role_key', true) IS NOT NULL 
    THEN '✅ Configurado (oculto por seguridad)'
    ELSE '❌ NO CONFIGURADO'
  END as service_role_key_status;

-- Si los valores están vacíos o NULL, ejecutar estos comandos:
-- (Reemplazar con los valores reales de tu proyecto)

-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://TU_PROJECT_REF.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'TU_SERVICE_ROLE_KEY';
-- ALTER DATABASE postgres SET app.settings.public_app_url = 'https://app.tupatrimonio.app';

-- Nota: Para encontrar estos valores:
-- - supabase_url: Supabase Dashboard > Settings > API > Project URL
-- - supabase_service_role_key: Supabase Dashboard > Settings > API > service_role key (⚠️ secreto)
-- - public_app_url: URL pública de tu aplicación (ej: https://app.tupatrimonio.app)

