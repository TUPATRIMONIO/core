-- =====================================================
-- Migration: Fix disconnect constraint
-- Description: Permite que los tokens sean NULL cuando is_active = false
-- Created: 2025-12-09
-- =====================================================

SET search_path TO crm, core, public, extensions;

-- Eliminar constraint anterior
ALTER TABLE crm.email_accounts 
  DROP CONSTRAINT IF EXISTS check_has_credentials;

-- Agregar constraint modificado que permite tokens NULL cuando está inactivo
ALTER TABLE crm.email_accounts 
  ADD CONSTRAINT check_has_credentials CHECK (
    -- Si está inactivo, puede no tener credenciales
    (is_active = false)
    OR
    -- Si está activo, debe tener credenciales según su tipo de conexión
    (
      is_active = true
      AND (
        (connection_type = 'oauth' AND gmail_oauth_tokens IS NOT NULL)
        OR
        (connection_type = 'imap_smtp' AND imap_config IS NOT NULL AND smtp_config IS NOT NULL)
      )
    )
  );

COMMENT ON CONSTRAINT check_has_credentials ON crm.email_accounts 
IS 'Valida que cuentas activas tengan credenciales. Cuentas inactivas pueden no tener credenciales.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Constraint check_has_credentials actualizado para permitir desconexión';
END $$;

