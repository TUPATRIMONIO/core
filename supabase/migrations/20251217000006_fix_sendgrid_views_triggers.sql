/**
 * Migración: Fix vistas SendGrid con INSTEAD OF triggers
 * 
 * Las RULES no soportan RETURNING. Reemplazamos con INSTEAD OF triggers.
 * 
 * Fecha: 17 Diciembre 2025
 */

-- ============================================================================
-- 1. ELIMINAR REGLAS ANTERIORES
-- ============================================================================

DROP RULE IF EXISTS sendgrid_accounts_insert ON public.sendgrid_accounts;
DROP RULE IF EXISTS sendgrid_accounts_update ON public.sendgrid_accounts;
DROP RULE IF EXISTS sendgrid_accounts_delete ON public.sendgrid_accounts;
DROP RULE IF EXISTS sender_identities_insert ON public.sender_identities;
DROP RULE IF EXISTS sender_identities_update ON public.sender_identities;
DROP RULE IF EXISTS sender_identities_delete ON public.sender_identities;

-- ============================================================================
-- 2. RECREAR VISTAS (necesario para limpiar estado)
-- ============================================================================

DROP VIEW IF EXISTS public.sendgrid_accounts CASCADE;
DROP VIEW IF EXISTS public.sender_identities CASCADE;

CREATE VIEW public.sendgrid_accounts AS
SELECT * FROM communications.sendgrid_accounts;

CREATE VIEW public.sender_identities AS
SELECT * FROM communications.sender_identities;

-- ============================================================================
-- 3. TRIGGERS INSTEAD OF PARA SENDGRID_ACCOUNTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sendgrid_accounts_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  new_row communications.sendgrid_accounts%ROWTYPE;
BEGIN
  INSERT INTO communications.sendgrid_accounts (
    id, organization_id, api_key, from_email, from_name,
    is_active, verified_at, last_verified_at, emails_sent_count,
    last_sent_at, created_at, updated_at, created_by
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.organization_id,
    NEW.api_key,
    NEW.from_email,
    NEW.from_name,
    COALESCE(NEW.is_active, true),
    NEW.verified_at,
    NEW.last_verified_at,
    COALESCE(NEW.emails_sent_count, 0),
    NEW.last_sent_at,
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
    NEW.created_by
  )
  RETURNING * INTO new_row;
  
  NEW.id := new_row.id;
  NEW.organization_id := new_row.organization_id;
  NEW.api_key := new_row.api_key;
  NEW.from_email := new_row.from_email;
  NEW.from_name := new_row.from_name;
  NEW.is_active := new_row.is_active;
  NEW.verified_at := new_row.verified_at;
  NEW.last_verified_at := new_row.last_verified_at;
  NEW.emails_sent_count := new_row.emails_sent_count;
  NEW.last_sent_at := new_row.last_sent_at;
  NEW.created_at := new_row.created_at;
  NEW.updated_at := new_row.updated_at;
  NEW.created_by := new_row.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sendgrid_accounts_update_trigger()
RETURNS TRIGGER AS $$
DECLARE
  updated_row communications.sendgrid_accounts%ROWTYPE;
BEGIN
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
    updated_at = NEW.updated_at
  WHERE id = OLD.id
  RETURNING * INTO updated_row;
  
  NEW.id := updated_row.id;
  NEW.organization_id := updated_row.organization_id;
  NEW.api_key := updated_row.api_key;
  NEW.from_email := updated_row.from_email;
  NEW.from_name := updated_row.from_name;
  NEW.is_active := updated_row.is_active;
  NEW.verified_at := updated_row.verified_at;
  NEW.last_verified_at := updated_row.last_verified_at;
  NEW.emails_sent_count := updated_row.emails_sent_count;
  NEW.last_sent_at := updated_row.last_sent_at;
  NEW.created_at := updated_row.created_at;
  NEW.updated_at := updated_row.updated_at;
  NEW.created_by := updated_row.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sendgrid_accounts_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM communications.sendgrid_accounts WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sendgrid_accounts_insert
  INSTEAD OF INSERT ON public.sendgrid_accounts
  FOR EACH ROW EXECUTE FUNCTION public.sendgrid_accounts_insert_trigger();

CREATE TRIGGER sendgrid_accounts_update
  INSTEAD OF UPDATE ON public.sendgrid_accounts
  FOR EACH ROW EXECUTE FUNCTION public.sendgrid_accounts_update_trigger();

CREATE TRIGGER sendgrid_accounts_delete
  INSTEAD OF DELETE ON public.sendgrid_accounts
  FOR EACH ROW EXECUTE FUNCTION public.sendgrid_accounts_delete_trigger();

-- ============================================================================
-- 4. TRIGGERS INSTEAD OF PARA SENDER_IDENTITIES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sender_identities_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
  new_row communications.sender_identities%ROWTYPE;
BEGIN
  INSERT INTO communications.sender_identities (
    id, organization_id, sendgrid_account_id, purpose, from_email,
    from_name, reply_to_email, is_default, is_active, created_at,
    updated_at, created_by
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.organization_id,
    NEW.sendgrid_account_id,
    NEW.purpose,
    NEW.from_email,
    NEW.from_name,
    NEW.reply_to_email,
    COALESCE(NEW.is_default, false),
    COALESCE(NEW.is_active, true),
    COALESCE(NEW.created_at, NOW()),
    COALESCE(NEW.updated_at, NOW()),
    NEW.created_by
  )
  RETURNING * INTO new_row;
  
  NEW.id := new_row.id;
  NEW.organization_id := new_row.organization_id;
  NEW.sendgrid_account_id := new_row.sendgrid_account_id;
  NEW.purpose := new_row.purpose;
  NEW.from_email := new_row.from_email;
  NEW.from_name := new_row.from_name;
  NEW.reply_to_email := new_row.reply_to_email;
  NEW.is_default := new_row.is_default;
  NEW.is_active := new_row.is_active;
  NEW.created_at := new_row.created_at;
  NEW.updated_at := new_row.updated_at;
  NEW.created_by := new_row.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sender_identities_update_trigger()
RETURNS TRIGGER AS $$
DECLARE
  updated_row communications.sender_identities%ROWTYPE;
BEGIN
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
    updated_at = NEW.updated_at
  WHERE id = OLD.id
  RETURNING * INTO updated_row;
  
  NEW.id := updated_row.id;
  NEW.organization_id := updated_row.organization_id;
  NEW.sendgrid_account_id := updated_row.sendgrid_account_id;
  NEW.purpose := updated_row.purpose;
  NEW.from_email := updated_row.from_email;
  NEW.from_name := updated_row.from_name;
  NEW.reply_to_email := updated_row.reply_to_email;
  NEW.is_default := updated_row.is_default;
  NEW.is_active := updated_row.is_active;
  NEW.created_at := updated_row.created_at;
  NEW.updated_at := updated_row.updated_at;
  NEW.created_by := updated_row.created_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sender_identities_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM communications.sender_identities WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sender_identities_insert
  INSTEAD OF INSERT ON public.sender_identities
  FOR EACH ROW EXECUTE FUNCTION public.sender_identities_insert_trigger();

CREATE TRIGGER sender_identities_update
  INSTEAD OF UPDATE ON public.sender_identities
  FOR EACH ROW EXECUTE FUNCTION public.sender_identities_update_trigger();

CREATE TRIGGER sender_identities_delete
  INSTEAD OF DELETE ON public.sender_identities
  FOR EACH ROW EXECUTE FUNCTION public.sender_identities_delete_trigger();

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sendgrid_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sender_identities TO authenticated;
GRANT ALL ON public.sendgrid_accounts TO service_role;
GRANT ALL ON public.sender_identities TO service_role;

-- ============================================================================
-- 6. LOG
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Vistas actualizadas con INSTEAD OF triggers';
END;
$$;
