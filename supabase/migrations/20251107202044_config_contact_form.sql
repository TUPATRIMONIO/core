-- Migration: Restaurar política pública para formulario de contacto
-- Description: Permite a usuarios anónimos enviar mensajes a través del formulario de contacto público
-- Created: 2024-11-07
-- Issue: El formulario de contacto arroja error {} porque falta la política de INSERT público

-- =====================================================
-- RESTAURAR POLÍTICA PÚBLICA DE INSERT
-- =====================================================

-- Verificar que no exista la política antes de crearla
DROP POLICY IF EXISTS "Anyone can send contact messages" ON marketing.contact_messages;

-- Crear política que permite a cualquier usuario (anon) insertar mensajes de contacto
CREATE POLICY "Anyone can send contact messages" 
ON marketing.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- =====================================================
-- VERIFICAR PERMISOS GRANT PARA ROL ANON
-- =====================================================

-- Asegurar que el rol anon tiene permiso de USAGE en el schema marketing
GRANT USAGE ON SCHEMA marketing TO anon;

-- Asegurar que el rol anon puede hacer INSERT en la tabla contact_messages
GRANT INSERT ON marketing.contact_messages TO anon;

-- Asegurar que el rol anon puede usar las sequences (para IDs autogenerados)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA marketing TO anon;

-- =====================================================
-- VERIFICAR POLÍTICAS EXISTENTES
-- =====================================================

-- Las siguientes políticas deben mantenerse intactas (solo verificación):
-- - "Platform admins can view contact messages" (SELECT para admins)
-- - "Platform admins can update contact messages" (UPDATE para admins)
-- - "Platform admins can delete contact messages" (DELETE para admins)

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON POLICY "Anyone can send contact messages" ON marketing.contact_messages IS 
'Permite a usuarios anónimos enviar mensajes a través del formulario de contacto público. Los mensajes se guardan con status=new para revisión por administradores.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Política pública de INSERT restaurada para contact_messages';
  RAISE NOTICE '✅ Permisos GRANT verificados para rol anon';
  RAISE NOTICE 'ℹ️  El formulario de contacto público ahora funciona correctamente';
  RAISE NOTICE 'ℹ️  Los mensajes se guardan con status=new para revisión administrativa';
END $$;

