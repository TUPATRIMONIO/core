-- =====================================================
-- Migration: Fix Security Definer para triggers de folders
-- Description: Permitir que los triggers creen carpetas sin problemas de RLS
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Los triggers que crean carpetas automáticamente al crear organizaciones
-- fallan con "permission denied" porque las funciones se ejecutan con el
-- contexto del usuario que inserta en organizations, y las políticas RLS
-- de crm.folders requieren ser platform admin.
--
-- SOLUCIÓN: Agregar SECURITY DEFINER a las funciones del trigger para que
-- se ejecuten con los permisos del propietario (postgres), omitiendo RLS.

-- =====================================================
-- PASO 1: RECREAR FUNCIÓN create_system_folders CON SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION crm.create_system_folders(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Carpeta principal: Inbox (Bandeja de entrada)
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Inbox', 'system', 'inbox', 'blue', true, 1);
  
  -- Carpeta de enviados
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Sent', 'system', 'send', 'green', false, 2);
  
  -- Carpeta de importantes/starred
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Important', 'system', 'star', 'yellow', false, 3);
  
  -- Carpeta de archivados
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Archive', 'system', 'archive', 'gray', false, 4);
  
  -- Carpeta de spam
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Spam', 'system', 'alert-circle', 'red', false, 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PASO 2: RECREAR FUNCIÓN auto_create_folders_for_new_org CON SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION crm.auto_create_folders_for_new_org()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM crm.create_system_folders(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION crm.create_system_folders IS 
'Crea carpetas del sistema para una organización. SECURITY DEFINER permite omitir RLS.';

COMMENT ON FUNCTION crm.auto_create_folders_for_new_org IS 
'Trigger function que auto-crea carpetas al crear una organización. SECURITY DEFINER permite omitir RLS.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Funciones de creación de carpetas actualizadas con SECURITY DEFINER';
  RAISE NOTICE '';
  RAISE NOTICE 'Los triggers ahora pueden:';
  RAISE NOTICE '  ✅ Crear carpetas automáticamente sin errores de RLS';
  RAISE NOTICE '  ✅ Ejecutarse con permisos de superusuario (postgres)';
  RAISE NOTICE '';
  RAISE NOTICE 'Esto soluciona el error "permission denied for table folders"';
END $$;

