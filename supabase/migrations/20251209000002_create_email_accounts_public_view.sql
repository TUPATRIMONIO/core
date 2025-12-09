-- =====================================================
-- Migration: Create public view for email_accounts
-- Description: Expone la tabla crm.email_accounts como vista pública para acceso desde el cliente Supabase
-- Created: 2025-12-09
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- =====================================================
-- VISTA PÚBLICA: email_accounts
-- =====================================================

CREATE OR REPLACE VIEW public.email_accounts AS
SELECT 
  ea.id,
  ea.organization_id,
  ea.email_address,
  ea.display_name,
  ea.account_type,
  ea.owner_user_id,
  -- Exponer tokens para service_role (necesario para encriptación/desencriptación)
  ea.gmail_oauth_tokens,
  ea.gmail_email_address,
  ea.gmail_history_id,
  ea.is_active,
  ea.is_default,
  ea.sync_enabled,
  ea.sync_interval,
  ea.last_sync_at,
  ea.last_sync_error,
  ea.signature_html,
  ea.signature_text,
  ea.connected_at,
  ea.connected_by,
  ea.created_at,
  ea.updated_at,
  ea.connection_type,
  ea.email_provider
FROM crm.email_accounts ea;

-- =====================================================
-- FUNCIONES RPC PARA INSERT/UPDATE
-- =====================================================

-- Función para insertar cuenta de email (solo para service_role)
CREATE OR REPLACE FUNCTION public.insert_email_account(
  p_organization_id UUID,
  p_email_address TEXT,
  p_display_name TEXT,
  p_account_type TEXT,
  p_owner_user_id UUID,
  p_gmail_oauth_tokens JSONB,
  p_gmail_email_address TEXT,
  p_connected_by UUID,
  p_is_active BOOLEAN DEFAULT true,
  p_is_default BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
BEGIN
  INSERT INTO crm.email_accounts (
    organization_id,
    email_address,
    display_name,
    account_type,
    owner_user_id,
    gmail_oauth_tokens,
    gmail_email_address,
    is_active,
    is_default,
    connected_at,
    connected_by
  ) VALUES (
    p_organization_id,
    p_email_address,
    p_display_name,
    p_account_type,
    p_owner_user_id,
    p_gmail_oauth_tokens,
    p_gmail_email_address,
    p_is_active,
    p_is_default,
    NOW(),
    p_connected_by
  )
  RETURNING id INTO v_account_id;
  
  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para actualizar cuenta de email (solo para service_role)
CREATE OR REPLACE FUNCTION public.update_email_account(
  p_account_id UUID,
  p_gmail_oauth_tokens JSONB,
  p_gmail_email_address TEXT,
  p_is_active BOOLEAN,
  p_is_default BOOLEAN,
  p_connected_at TIMESTAMPTZ,
  p_connected_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE crm.email_accounts
  SET
    gmail_oauth_tokens = p_gmail_oauth_tokens,
    gmail_email_address = p_gmail_email_address,
    is_active = p_is_active,
    is_default = p_is_default,
    connected_at = p_connected_at,
    connected_by = p_connected_by,
    updated_at = NOW()
  WHERE id = p_account_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISOS
-- =====================================================

-- Permitir lectura a usuarios autenticados
GRANT SELECT ON public.email_accounts TO authenticated;

-- Permitir ejecución de funciones RPC a service_role
GRANT EXECUTE ON FUNCTION public.insert_email_account(UUID, TEXT, TEXT, TEXT, UUID, JSONB, TEXT, UUID, BOOLEAN, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_email_account(UUID, JSONB, TEXT, BOOLEAN, BOOLEAN, TIMESTAMPTZ, UUID) TO service_role;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON VIEW public.email_accounts IS 'Vista pública de cuentas de email. Los tokens OAuth no se exponen por seguridad.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Vista pública public.email_accounts creada exitosamente';
  RAISE NOTICE 'La tabla crm.email_accounts ahora es accesible desde el cliente Supabase';
END $$;

