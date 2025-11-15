/**
 * Migración: Soporte IMAP/SMTP para Email Multi-Cuenta
 * 
 * Permite conectar cuentas de email vía IMAP/SMTP además de OAuth,
 * habilitando cualquier proveedor (Gmail, Outlook, Yahoo, custom domains)
 * sin restricciones de Google OAuth verification.
 * 
 * Fecha: 14 Noviembre 2025
 */

-- ============================================================================
-- 1. AGREGAR TIPO DE CONEXIÓN
-- ============================================================================

-- Tipo de conexión: OAuth o IMAP/SMTP
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_connection_type') THEN
    CREATE TYPE crm.email_connection_type AS ENUM ('oauth', 'imap_smtp');
  END IF;
END $$;

ALTER TABLE crm.email_accounts 
  ADD COLUMN IF NOT EXISTS connection_type crm.email_connection_type DEFAULT 'oauth';

-- Actualizar cuentas existentes como OAuth
UPDATE crm.email_accounts 
SET connection_type = 'oauth' 
WHERE connection_type IS NULL;

COMMENT ON COLUMN crm.email_accounts.connection_type IS 'Tipo de conexión: oauth (Gmail API) o imap_smtp (protocolo estándar)';

-- ============================================================================
-- 2. AGREGAR CONFIGURACIONES IMAP/SMTP
-- ============================================================================

ALTER TABLE crm.email_accounts 
  ADD COLUMN IF NOT EXISTS imap_config JSONB,
  ADD COLUMN IF NOT EXISTS smtp_config JSONB,
  ADD COLUMN IF NOT EXISTS email_provider TEXT; -- gmail, outlook, yahoo, custom

COMMENT ON COLUMN crm.email_accounts.imap_config IS 'Configuración IMAP encriptada: {host, port, username, password (encrypted), tls}';
COMMENT ON COLUMN crm.email_accounts.smtp_config IS 'Configuración SMTP encriptada: {host, port, username, password (encrypted), secure}';
COMMENT ON COLUMN crm.email_accounts.email_provider IS 'Proveedor detectado: gmail, outlook, yahoo, custom';

-- ============================================================================
-- 3. ACTUALIZAR CONSTRAINTS
-- ============================================================================

-- Hacer gmail_oauth_tokens opcional (solo para OAuth)
ALTER TABLE crm.email_accounts 
  ALTER COLUMN gmail_oauth_tokens DROP NOT NULL;

-- Agregar constraint: debe tener OAuth tokens O IMAP/SMTP config
ALTER TABLE crm.email_accounts 
  ADD CONSTRAINT check_has_credentials CHECK (
    (connection_type = 'oauth' AND gmail_oauth_tokens IS NOT NULL)
    OR
    (connection_type = 'imap_smtp' AND imap_config IS NOT NULL AND smtp_config IS NOT NULL)
  );

COMMENT ON CONSTRAINT check_has_credentials ON crm.email_accounts 
IS 'Valida que cuentas OAuth tengan tokens y cuentas IMAP tengan configuración';

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_accounts_connection_type 
  ON crm.email_accounts(organization_id, connection_type) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_email_accounts_provider 
  ON crm.email_accounts(email_provider) 
  WHERE email_provider IS NOT NULL;

-- ============================================================================
-- 5. FUNCIÓN AUXILIAR: Detectar Proveedor
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.detect_email_provider(
  email_address TEXT
)
RETURNS TEXT AS $$
DECLARE
  domain TEXT;
BEGIN
  -- Extraer dominio del email
  domain := LOWER(SPLIT_PART(email_address, '@', 2));
  
  -- Detectar proveedor conocido
  CASE 
    WHEN domain IN ('gmail.com', 'googlemail.com') THEN
      RETURN 'gmail';
    WHEN domain IN ('outlook.com', 'hotmail.com', 'live.com', 'msn.com') THEN
      RETURN 'outlook';
    WHEN domain IN ('yahoo.com', 'ymail.com', 'rocketmail.com') THEN
      RETURN 'yahoo';
    WHEN domain IN ('icloud.com', 'me.com', 'mac.com') THEN
      RETURN 'icloud';
    ELSE
      RETURN 'custom';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION crm.detect_email_provider IS 'Detecta el proveedor de email a partir de la dirección';

-- ============================================================================
-- 6. MIGRACIÓN DE DATOS EXISTENTES
-- ============================================================================

-- Marcar cuentas existentes como OAuth y detectar provider
UPDATE crm.email_accounts
SET 
  connection_type = 'oauth',
  email_provider = crm.detect_email_provider(email_address)
WHERE connection_type IS NULL OR email_provider IS NULL;

-- ============================================================================
-- 7. DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TYPE crm.email_connection_type IS 'oauth: Gmail API con OAuth 2.0, imap_smtp: Protocolo IMAP/SMTP estándar';
