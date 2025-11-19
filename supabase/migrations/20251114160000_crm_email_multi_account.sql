/**
 * Migración: Sistema Multi-Cuenta de Gmail para CRM
 * 
 * Características:
 * - Múltiples cuentas de Gmail por organización (compartidas y personales)
 * - Sistema de permisos para controlar quién usa qué cuenta
 * - Threading de conversaciones
 * - Sincronización de emails entrantes
 * 
 * Fecha: 14 Noviembre 2025
 */

-- ============================================================================
-- 1. TABLA: email_accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm.email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información de la cuenta
  email_address TEXT NOT NULL,
  display_name TEXT, -- "Soporte TuPatrimonio", "Felipe Leveke"
  
  -- Tipo de cuenta
  account_type TEXT NOT NULL CHECK (account_type IN ('shared', 'personal')),
  
  -- Si es personal, vincula al dueño
  owner_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Tokens OAuth de Gmail (encriptar en producción)
  gmail_oauth_tokens JSONB NOT NULL,
  
  -- Información adicional de Gmail
  gmail_email_address TEXT, -- Email real retornado por Gmail (puede diferir)
  gmail_history_id TEXT, -- Para sincronización incremental
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Cuenta por defecto de la org
  
  -- Configuración de sincronización
  sync_enabled BOOLEAN DEFAULT true,
  sync_interval INTEGER DEFAULT 5, -- minutos
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  
  -- Configuración de firma
  signature_html TEXT,
  signature_text TEXT,
  
  -- Metadatos
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  connected_by UUID REFERENCES core.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(organization_id, email_address),
  CHECK (
    (account_type = 'personal' AND owner_user_id IS NOT NULL) OR
    (account_type = 'shared' AND owner_user_id IS NULL)
  )
);

COMMENT ON TABLE crm.email_accounts IS 'Cuentas de Gmail conectadas al CRM (compartidas y personales)';
COMMENT ON COLUMN crm.email_accounts.account_type IS 'shared: usada por múltiples usuarios, personal: solo el dueño';
COMMENT ON COLUMN crm.email_accounts.is_default IS 'Cuenta por defecto de la organización para envíos';

-- ============================================================================
-- 2. TABLA: email_account_permissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm.email_account_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  email_account_id UUID NOT NULL REFERENCES crm.email_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Permisos
  can_send BOOLEAN DEFAULT true,
  can_receive BOOLEAN DEFAULT true, -- Ver emails recibidos en esta cuenta
  is_default BOOLEAN DEFAULT false, -- Cuenta por defecto del usuario
  
  -- Metadatos
  granted_by UUID REFERENCES core.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(email_account_id, user_id)
);

COMMENT ON TABLE crm.email_account_permissions IS 'Permisos de usuarios sobre cuentas de email compartidas';

-- ============================================================================
-- 3. TABLA: email_threads
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información de Gmail
  gmail_thread_id TEXT NOT NULL, -- Thread ID de Gmail
  
  -- Asociaciones
  contact_id UUID REFERENCES crm.contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm.companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm.deals(id) ON DELETE SET NULL,
  
  -- Contenido
  subject TEXT,
  snippet TEXT, -- Primeros 100 chars del último email
  
  -- Participantes (array de emails)
  participants TEXT[] DEFAULT '{}',
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'spam')),
  is_read BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  
  -- Estadísticas
  email_count INTEGER DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  last_email_from TEXT,
  
  -- Labels de Gmail
  labels TEXT[] DEFAULT '{}',
  
  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, gmail_thread_id)
);

COMMENT ON TABLE crm.email_threads IS 'Hilos de conversación de emails agrupados por thread_id de Gmail';

-- ============================================================================
-- 4. ACTUALIZAR TABLA: emails
-- ============================================================================

-- Agregar columnas para soporte multi-cuenta y threading
-- PostgreSQL requiere ejecutar cada ADD COLUMN por separado cuando se usan referencias
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS sent_from_account_id UUID REFERENCES crm.email_accounts(id);
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS received_in_account_id UUID REFERENCES crm.email_accounts(id);
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS thread_id_crm UUID REFERENCES crm.email_threads(id);
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS parent_email_id UUID REFERENCES crm.emails(id);
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS snippet TEXT;
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS in_reply_to TEXT;
ALTER TABLE crm.emails ADD COLUMN IF NOT EXISTS "references" TEXT[]; -- Escapar palabra reservada

COMMENT ON COLUMN crm.emails.sent_from_account_id IS 'Cuenta desde la que se envió (si es outbound)';
COMMENT ON COLUMN crm.emails.received_in_account_id IS 'Cuenta en la que se recibió (si es inbound)';
COMMENT ON COLUMN crm.emails.thread_id_crm IS 'Referencia al thread/conversación';

-- ============================================================================
-- 5. ACTUALIZAR TABLA: settings
-- ============================================================================

-- Agregar configuración de emails a nivel organización
ALTER TABLE crm.settings 
  ADD COLUMN IF NOT EXISTS email_settings JSONB DEFAULT '{
    "allow_personal_accounts": true,
    "require_approval_for_personal": false,
    "default_from_name": "",
    "signature_html": "",
    "sync_enabled": true,
    "sync_interval_minutes": 5
  }'::jsonb;

-- Deprecar gmail_oauth_tokens (ahora se usan email_accounts)
COMMENT ON COLUMN crm.settings.gmail_oauth_tokens IS 'DEPRECATED: Usar crm.email_accounts en su lugar';

-- ============================================================================
-- 6. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_accounts_org ON crm.email_accounts(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_accounts_owner ON crm.email_accounts(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_accounts_type ON crm.email_accounts(organization_id, account_type);
CREATE INDEX IF NOT EXISTS idx_email_accounts_sync ON crm.email_accounts(id) WHERE sync_enabled = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_email_permissions_user ON crm.email_account_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_permissions_account ON crm.email_account_permissions(email_account_id);

CREATE INDEX IF NOT EXISTS idx_email_threads_org ON crm.email_threads(organization_id, last_email_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_contact ON crm.email_threads(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_threads_gmail ON crm.email_threads(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_status ON crm.email_threads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_threads_unread ON crm.email_threads(organization_id) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_emails_account_sent ON crm.emails(sent_from_account_id) WHERE sent_from_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_account_received ON crm.emails(received_in_account_id) WHERE received_in_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_thread ON crm.emails(thread_id_crm) WHERE thread_id_crm IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_parent ON crm.emails(parent_email_id) WHERE parent_email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_unread ON crm.emails(organization_id) WHERE is_read = false AND direction = 'inbound';

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION crm.update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_accounts_updated_at
  BEFORE UPDATE ON crm.email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION crm.update_email_accounts_updated_at();

CREATE TRIGGER trigger_email_permissions_updated_at
  BEFORE UPDATE ON crm.email_account_permissions
  FOR EACH ROW
  EXECUTE FUNCTION crm.update_email_accounts_updated_at();

CREATE TRIGGER trigger_email_threads_updated_at
  BEFORE UPDATE ON crm.email_threads
  FOR EACH ROW
  EXECUTE FUNCTION crm.update_email_accounts_updated_at();

-- Actualizar contador de emails en thread
CREATE OR REPLACE FUNCTION crm.update_thread_email_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.thread_id_crm IS NOT NULL THEN
    UPDATE crm.email_threads
    SET 
      email_count = email_count + 1,
      last_email_at = NEW.sent_at,
      last_email_from = COALESCE(NEW.from_email, ''),
      updated_at = NOW()
    WHERE id = NEW.thread_id_crm;
  ELSIF TG_OP = 'DELETE' AND OLD.thread_id_crm IS NOT NULL THEN
    UPDATE crm.email_threads
    SET 
      email_count = GREATEST(email_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.thread_id_crm;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_count
  AFTER INSERT OR DELETE ON crm.emails
  FOR EACH ROW
  EXECUTE FUNCTION crm.update_thread_email_count();

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE crm.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.email_account_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.email_threads ENABLE ROW LEVEL SECURITY;

-- Políticas para email_accounts
DROP POLICY IF EXISTS "Users can view email accounts in their org" ON crm.email_accounts;
CREATE POLICY "Users can view email accounts in their org"
  ON crm.email_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Owners can manage email accounts" ON crm.email_accounts;
CREATE POLICY "Owners can manage email accounts"
  ON crm.email_accounts FOR ALL
  USING (
    organization_id IN (
      SELECT ou.organization_id FROM core.organization_users ou
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid() 
      AND ou.status = 'active'
      AND r.name IN ('owner', 'admin')
    )
  );

-- Políticas para email_account_permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON crm.email_account_permissions;
CREATE POLICY "Users can view their own permissions"
  ON crm.email_account_permissions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage permissions" ON crm.email_account_permissions;
CREATE POLICY "Owners can manage permissions"
  ON crm.email_account_permissions FOR ALL
  USING (
    email_account_id IN (
      SELECT ea.id FROM crm.email_accounts ea
      JOIN core.organization_users ou ON ou.organization_id = ea.organization_id
      JOIN core.roles r ON r.id = ou.role_id
      WHERE ou.user_id = auth.uid()
      AND ou.status = 'active'
      AND r.name IN ('owner', 'admin')
    )
  );

-- Políticas para email_threads
DROP POLICY IF EXISTS "Users can view threads in their org" ON crm.email_threads;
CREATE POLICY "Users can view threads in their org"
  ON crm.email_threads FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users with CRM access can manage threads" ON crm.email_threads;
CREATE POLICY "Users with CRM access can manage threads"
  ON crm.email_threads FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================================
-- 9. FUNCIONES AUXILIARES
-- ============================================================================

-- Función para obtener cuentas disponibles de un usuario
CREATE OR REPLACE FUNCTION crm.get_user_email_accounts(
  user_uuid UUID,
  org_id UUID
)
RETURNS TABLE (
  account_id UUID,
  email_address TEXT,
  display_name TEXT,
  account_type TEXT,
  can_send BOOLEAN,
  can_receive BOOLEAN,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Cuentas personales del usuario
  SELECT 
    ea.id,
    ea.email_address,
    ea.display_name,
    ea.account_type,
    true as can_send,
    true as can_receive,
    ea.is_default
  FROM crm.email_accounts ea
  WHERE ea.organization_id = org_id
  AND ea.owner_user_id = user_uuid
  AND ea.is_active = true
  
  UNION ALL
  
  -- Cuentas compartidas con permisos
  SELECT 
    ea.id,
    ea.email_address,
    ea.display_name,
    ea.account_type,
    eap.can_send,
    eap.can_receive,
    eap.is_default
  FROM crm.email_accounts ea
  JOIN crm.email_account_permissions eap ON eap.email_account_id = ea.id
  WHERE ea.organization_id = org_id
  AND eap.user_id = user_uuid
  AND ea.is_active = true
  AND eap.revoked_at IS NULL
  
  ORDER BY is_default DESC, email_address ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener cuenta por defecto de un usuario
CREATE OR REPLACE FUNCTION crm.get_user_default_email_account(
  user_uuid UUID,
  org_id UUID
)
RETURNS UUID AS $$
DECLARE
  account_uuid UUID;
BEGIN
  -- Primero buscar cuenta marcada como default para el usuario
  SELECT account_id INTO account_uuid
  FROM crm.get_user_email_accounts(user_uuid, org_id)
  WHERE is_default = true
  LIMIT 1;
  
  -- Si no hay, retornar la primera disponible
  IF account_uuid IS NULL THEN
    SELECT account_id INTO account_uuid
    FROM crm.get_user_email_accounts(user_uuid, org_id)
    WHERE can_send = true
    LIMIT 1;
  END IF;
  
  RETURN account_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para migrar datos existentes
CREATE OR REPLACE FUNCTION crm.migrate_existing_gmail_tokens()
RETURNS void AS $$
DECLARE
  setting_record RECORD;
  new_account_id UUID;
BEGIN
  -- Migrar tokens existentes en crm.settings a email_accounts
  FOR setting_record IN 
    SELECT organization_id, gmail_oauth_tokens
    FROM crm.settings
    WHERE gmail_oauth_tokens IS NOT NULL
  LOOP
    -- Crear cuenta compartida con los tokens existentes
    INSERT INTO crm.email_accounts (
      organization_id,
      email_address,
      display_name,
      account_type,
      gmail_oauth_tokens,
      gmail_email_address,
      is_default,
      is_active
    ) VALUES (
      setting_record.organization_id,
      COALESCE((setting_record.gmail_oauth_tokens->>'email')::TEXT, 'legacy@tupatrimonio.app'),
      'Cuenta Principal',
      'shared',
      setting_record.gmail_oauth_tokens,
      (setting_record.gmail_oauth_tokens->>'email')::TEXT,
      true, -- Marca como default
      true
    )
    ON CONFLICT (organization_id, email_address) DO NOTHING
    RETURNING id INTO new_account_id;
    
    -- Actualizar emails existentes para vincular a esta cuenta
    IF new_account_id IS NOT NULL THEN
      UPDATE crm.emails
      SET sent_from_account_id = new_account_id
      WHERE organization_id = setting_record.organization_id
      AND direction = 'outbound'
      AND sent_from_account_id IS NULL;
    END IF;
    
    RAISE NOTICE 'Migrated Gmail tokens for org: %', setting_record.organization_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar migración automáticamente
SELECT crm.migrate_existing_gmail_tokens();

-- ============================================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================================================

COMMENT ON FUNCTION crm.get_user_email_accounts IS 'Retorna todas las cuentas de email disponibles para un usuario (personales + compartidas con permiso)';
COMMENT ON FUNCTION crm.get_user_default_email_account IS 'Retorna la cuenta de email por defecto de un usuario';
COMMENT ON FUNCTION crm.migrate_existing_gmail_tokens IS 'Migra tokens existentes de crm.settings a crm.email_accounts';

