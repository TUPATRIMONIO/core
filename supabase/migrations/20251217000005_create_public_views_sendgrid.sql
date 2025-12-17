/**
 * Migración: Crear vistas públicas para tablas de communications
 * 
 * El API de Supabase solo permite acceder a los schemas public y graphql_public.
 * Creamos vistas en public que referencian las tablas de communications.
 * 
 * Fecha: 17 Diciembre 2025
 */

-- ============================================================================
-- 1. CREAR VISTAS EN PUBLIC PARA SENDGRID
-- ============================================================================

-- Vista para sendgrid_accounts
CREATE OR REPLACE VIEW public.sendgrid_accounts AS
SELECT * FROM communications.sendgrid_accounts;

-- Vista para sender_identities
CREATE OR REPLACE VIEW public.sender_identities AS
SELECT * FROM communications.sender_identities;

-- ============================================================================
-- 2. GRANTS PARA LAS VISTAS
-- ============================================================================

-- Permitir acceso a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sendgrid_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sender_identities TO authenticated;

-- Permitir acceso al service_role
GRANT ALL ON public.sendgrid_accounts TO service_role;
GRANT ALL ON public.sender_identities TO service_role;

-- ============================================================================
-- 3. CREAR REGLAS PARA INSERT/UPDATE/DELETE EN LAS VISTAS
-- ============================================================================

-- Reglas para sendgrid_accounts
CREATE OR REPLACE RULE sendgrid_accounts_insert AS
ON INSERT TO public.sendgrid_accounts
DO INSTEAD
INSERT INTO communications.sendgrid_accounts VALUES (NEW.*);

CREATE OR REPLACE RULE sendgrid_accounts_update AS
ON UPDATE TO public.sendgrid_accounts
DO INSTEAD
UPDATE communications.sendgrid_accounts
SET 
  organization_id = NEW.organization_id,
  api_key = NEW.api_key,
  from_email = NEW.from_email,
  from_name = NEW.from_name,
  is_active = NEW.is_active,
  verified_at = NEW.verified_at,
  last_verified_at = NEW.last_verified_at,
  emails_sent_count = NEW.emails_sent_count,
  last_sent_at = NEW.last_sent_at,
  created_at = NEW.created_at,
  updated_at = NEW.updated_at,
  created_by = NEW.created_by
WHERE id = OLD.id;

CREATE OR REPLACE RULE sendgrid_accounts_delete AS
ON DELETE TO public.sendgrid_accounts
DO INSTEAD
DELETE FROM communications.sendgrid_accounts WHERE id = OLD.id;

-- Reglas para sender_identities
CREATE OR REPLACE RULE sender_identities_insert AS
ON INSERT TO public.sender_identities
DO INSTEAD
INSERT INTO communications.sender_identities VALUES (NEW.*);

CREATE OR REPLACE RULE sender_identities_update AS
ON UPDATE TO public.sender_identities
DO INSTEAD
UPDATE communications.sender_identities
SET 
  organization_id = NEW.organization_id,
  sendgrid_account_id = NEW.sendgrid_account_id,
  purpose = NEW.purpose,
  from_email = NEW.from_email,
  from_name = NEW.from_name,
  reply_to_email = NEW.reply_to_email,
  is_default = NEW.is_default,
  is_active = NEW.is_active,
  created_at = NEW.created_at,
  updated_at = NEW.updated_at,
  created_by = NEW.created_by
WHERE id = OLD.id;

CREATE OR REPLACE RULE sender_identities_delete AS
ON DELETE TO public.sender_identities
DO INSTEAD
DELETE FROM communications.sender_identities WHERE id = OLD.id;

-- ============================================================================
-- 4. LOG DE MIGRACIÓN
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Vistas públicas creadas para:';
  RAISE NOTICE '  📧 public.sendgrid_accounts -> communications.sendgrid_accounts';
  RAISE NOTICE '  📧 public.sender_identities -> communications.sender_identities';
END;
$$;
