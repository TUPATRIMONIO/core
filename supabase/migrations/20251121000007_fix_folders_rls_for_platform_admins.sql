-- =====================================================
-- Migration: Fix RLS de folders para Platform Admins
-- Description: Permitir a platform admins gestionar folders sin consultar organization_users
-- Created: 2025-11-21
-- =====================================================

-- =====================================================
-- PROBLEMA IDENTIFICADO
-- =====================================================
-- Cuando un platform admin crea una organización, el trigger
-- `trigger_create_folders_for_new_org` intenta crear carpetas del sistema,
-- pero las políticas RLS de crm.folders requieren que el usuario sea
-- miembro activo en organization_users, causando "permission denied".
--
-- SOLUCIÓN: Agregar políticas que permitan a platform admins (usando la función
-- is_platform_super_admin_bypass que NO consulta organization_users) gestionar
-- todas las carpetas y etiquetas del CRM.

-- =====================================================
-- PASO 1: AGREGAR POLÍTICAS PARA crm.folders
-- =====================================================

-- Platform admins pueden ver todas las carpetas
CREATE POLICY "Platform admins can view all folders"
  ON crm.folders FOR SELECT
  USING (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden insertar carpetas en cualquier organización
CREATE POLICY "Platform admins can insert folders"
  ON crm.folders FOR INSERT
  WITH CHECK (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden actualizar cualquier carpeta
CREATE POLICY "Platform admins can update folders"
  ON crm.folders FOR UPDATE
  USING (public.is_platform_super_admin_bypass(auth.uid()))
  WITH CHECK (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden eliminar cualquier carpeta
CREATE POLICY "Platform admins can delete folders"
  ON crm.folders FOR DELETE
  USING (public.is_platform_super_admin_bypass(auth.uid()));

-- =====================================================
-- PASO 2: AGREGAR POLÍTICAS PARA crm.thread_labels
-- =====================================================

-- Platform admins pueden ver todas las etiquetas
CREATE POLICY "Platform admins can view all thread labels"
  ON crm.thread_labels FOR SELECT
  USING (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden insertar etiquetas
CREATE POLICY "Platform admins can insert thread labels"
  ON crm.thread_labels FOR INSERT
  WITH CHECK (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden actualizar etiquetas
CREATE POLICY "Platform admins can update thread labels"
  ON crm.thread_labels FOR UPDATE
  USING (public.is_platform_super_admin_bypass(auth.uid()))
  WITH CHECK (public.is_platform_super_admin_bypass(auth.uid()));

-- Platform admins pueden eliminar etiquetas
CREATE POLICY "Platform admins can delete thread labels"
  ON crm.thread_labels FOR DELETE
  USING (public.is_platform_super_admin_bypass(auth.uid()));

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON POLICY "Platform admins can view all folders" ON crm.folders IS 
'Permite a platform admins ver todas las carpetas sin consultar organization_users';

COMMENT ON POLICY "Platform admins can insert folders" ON crm.folders IS 
'Permite a platform admins crear carpetas (necesario para trigger de auto-creación)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Políticas RLS para platform admins agregadas a crm.folders y crm.thread_labels';
  RAISE NOTICE '';
  RAISE NOTICE 'Los platform admins ahora pueden:';
  RAISE NOTICE '  ✅ Crear organizaciones sin error de "permission denied"';
  RAISE NOTICE '  ✅ Gestionar carpetas y etiquetas del CRM de cualquier organización';
  RAISE NOTICE '';
  RAISE NOTICE 'El trigger trigger_create_folders_for_new_org funcionará correctamente';
END $$;

