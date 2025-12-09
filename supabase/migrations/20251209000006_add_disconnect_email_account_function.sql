-- =====================================================
-- Migration: Add disconnect_email_account function
-- Description: Función RPC para desconectar cuentas de email
-- Created: 2025-12-09
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- Función para desconectar cuenta de email (solo para service_role)
CREATE OR REPLACE FUNCTION public.disconnect_email_account(
  p_account_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE crm.email_accounts
  SET
    is_active = false,
    gmail_oauth_tokens = NULL,
    updated_at = NOW()
  WHERE id = p_account_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.disconnect_email_account(UUID) TO service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función disconnect_email_account creada exitosamente';
END $$;

