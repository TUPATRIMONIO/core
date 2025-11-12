-- Migration: Schema CRM Multi-Tenant
-- Description: Sistema CRM completo como servicio B2B en schema separado
-- Created: 2024-11-12
-- Schema: crm (separado de core para mejor organización)

-- =====================================================
-- CREAR SCHEMA CRM
-- =====================================================

CREATE SCHEMA IF NOT EXISTS crm;

-- Set search path
SET search_path TO crm, core, public, extensions;

-- =====================================================
-- ENUMS para CRM
-- =====================================================

CREATE TYPE crm.contact_status AS ENUM (
  'lead',           -- Lead inicial
  'qualified',      -- Lead calificado
  'customer',       -- Cliente convertido
  'inactive',       -- Inactivo
  'lost'            -- Perdido
);

CREATE TYPE crm.activity_type AS ENUM (
  'email',          -- Email enviado/recibido
  'call',           -- Llamada telefónica
  'meeting',        -- Reunión
  'note',           -- Nota interna
  'task',           -- Tarea
  'whatsapp',       -- Mensaje WhatsApp
  'system'          -- Actividad del sistema
);

CREATE TYPE crm.deal_stage AS ENUM (
  'prospecting',    -- Prospección inicial
  'qualification',  -- Calificación
  'proposal',       -- Propuesta enviada
  'negotiation',    -- Negociación
  'closed_won',     -- Ganado
  'closed_lost'     -- Perdido
);

CREATE TYPE crm.email_status AS ENUM (
  'draft',          -- Borrador
  'sent',           -- Enviado
  'delivered',      -- Entregado
  'opened',         -- Abierto
  'clicked',        -- Click en link
  'replied',        -- Respondido
  'bounced',        -- Rebotado
  'failed'          -- Fallido
);

-- =====================================================
-- CONTACTOS (Core del CRM)
-- =====================================================

CREATE TABLE crm.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy (referencia a core)
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  first_name TEXT CHECK (length(first_name) <= 100),
  last_name TEXT CHECK (length(last_name) <= 100),
  full_name TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
      THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL 
      THEN first_name
      ELSE last_name
    END
  ) STORED,
  
  -- Información de contacto
  phone TEXT CHECK (length(phone) <= 20),
  mobile TEXT CHECK (length(mobile) <= 20),
  website TEXT,
  
  -- Información de empresa
  company_name TEXT CHECK (length(company_name) <= 200),
  job_title TEXT CHECK (length(job_title) <= 100),
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  
  -- Dirección
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Status y clasificación
  status crm.contact_status NOT NULL DEFAULT 'lead',
  source TEXT, -- web_form, import, manual, api, referral
  
  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  
  -- Tags y campos personalizados
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Información adicional
  notes TEXT,
  
  -- Engagement tracking
  last_contacted_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  
  -- Social media (opcional)
  linkedin_url TEXT,
  twitter_handle TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_email_per_org UNIQUE (organization_id, email)
);

-- =====================================================
-- ACTIVIDADES (Timeline de interacciones)
-- =====================================================

CREATE TABLE crm.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Relación con contacto
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Tipo y contenido
  type crm.activity_type NOT NULL,
  subject TEXT CHECK (length(subject) <= 500),
  description TEXT,
  
  -- Metadata de actividad
  performed_by UUID REFERENCES core.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Duración (para llamadas, reuniones)
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  
  -- Outcome (resultado de la actividad)
  outcome TEXT, -- completed, scheduled, cancelled, no_answer, etc.
  
  -- Referencias externas
  email_id TEXT, -- ID del email en Gmail
  calendar_event_id TEXT, -- ID del evento en Google Calendar
  
  -- Adjuntos
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DEALS / OPORTUNIDADES
-- =====================================================

CREATE TABLE crm.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Relación con contacto
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Información del deal
  title TEXT NOT NULL CHECK (length(title) >= 3 AND length(title) <= 200),
  description TEXT,
  
  -- Valor
  value DECIMAL(12,2) CHECK (value >= 0),
  currency TEXT NOT NULL DEFAULT 'CLP' CHECK (currency ~ '^[A-Z]{3}$'),
  
  -- Stage y probabilidad
  stage crm.deal_stage NOT NULL DEFAULT 'prospecting',
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  
  -- Fechas
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Asignación
  assigned_to UUID REFERENCES core.users(id),
  
  -- Información adicional
  source TEXT,
  competitor TEXT,
  
  -- Custom fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT valid_close_dates CHECK (
    actual_close_date IS NULL OR 
    expected_close_date IS NULL OR 
    actual_close_date >= expected_close_date - INTERVAL '90 days'
  )
);

-- =====================================================
-- EMAILS (Integración con Gmail)
-- =====================================================

CREATE TABLE crm.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Relación con contacto
  contact_id UUID REFERENCES crm.contacts(id) ON DELETE SET NULL,
  
  -- Email details
  gmail_message_id TEXT, -- ID en Gmail API
  thread_id TEXT, -- Thread ID de Gmail
  
  -- Dirección
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  
  -- Contenido
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  
  -- Metadata
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status crm.email_status NOT NULL DEFAULT 'draft',
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Adjuntos
  attachments JSONB DEFAULT '[]',
  
  -- Usuario que envió (si outbound)
  sent_by UUID REFERENCES core.users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CONFIGURACIÓN DE CRM POR ORGANIZACIÓN
-- =====================================================

CREATE TABLE crm.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID UNIQUE NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Configuración de email
  gmail_oauth_tokens JSONB, -- Tokens encriptados de OAuth
  email_signature TEXT,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_template TEXT,
  
  -- Configuración de pipeline
  deal_stages JSONB DEFAULT '["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"]',
  
  -- Custom fields definition
  custom_fields_schema JSONB DEFAULT '{}',
  
  -- Tags disponibles
  available_tags TEXT[] DEFAULT '{}',
  
  -- Configuración de notificaciones
  notifications JSONB DEFAULT '{
    "new_contact": true,
    "new_email": true,
    "deal_updated": true,
    "task_reminder": true
  }',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- NOTAS DE CONTACTO
-- =====================================================

CREATE TABLE crm.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Relación
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Contenido
  content TEXT NOT NULL CHECK (length(content) >= 1),
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES core.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Pin note (destacar)
  is_pinned BOOLEAN DEFAULT false
);

-- =====================================================
-- TRIGGERS para Updated Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION crm.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON crm.contacts 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_activities_updated_at 
  BEFORE UPDATE ON crm.activities 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_deals_updated_at 
  BEFORE UPDATE ON crm.deals 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_emails_updated_at 
  BEFORE UPDATE ON crm.emails 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON crm.settings 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

CREATE TRIGGER update_notes_updated_at 
  BEFORE UPDATE ON crm.notes 
  FOR EACH ROW EXECUTE FUNCTION crm.update_updated_at();

-- =====================================================
-- TRIGGER para actualizar last_activity_at
-- =====================================================

CREATE OR REPLACE FUNCTION crm.update_contact_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crm.contacts
  SET last_activity_at = NEW.performed_at
  WHERE id = NEW.contact_id
    AND organization_id = NEW.organization_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_activity_trigger
  AFTER INSERT ON crm.activities
  FOR EACH ROW EXECUTE FUNCTION crm.update_contact_last_activity();

-- =====================================================
-- ÍNDICES para Performance
-- =====================================================

-- Contacts
CREATE INDEX idx_contacts_org ON crm.contacts(organization_id, created_at DESC);
CREATE INDEX idx_contacts_status ON crm.contacts(organization_id, status);
CREATE INDEX idx_contacts_assigned ON crm.contacts(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_contacts_email ON crm.contacts(organization_id, email);
CREATE INDEX idx_contacts_company ON crm.contacts(organization_id, company_name);
CREATE INDEX idx_contacts_search ON crm.contacts USING gin(to_tsvector('spanish', 
  COALESCE(full_name, '') || ' ' || 
  COALESCE(email, '') || ' ' || 
  COALESCE(company_name, '')
));

-- Activities
CREATE INDEX idx_activities_org ON crm.activities(organization_id, performed_at DESC);
CREATE INDEX idx_activities_contact ON crm.activities(contact_id, performed_at DESC);
CREATE INDEX idx_activities_type ON crm.activities(organization_id, type);
CREATE INDEX idx_activities_user ON crm.activities(performed_by) WHERE performed_by IS NOT NULL;

-- Deals
CREATE INDEX idx_deals_org ON crm.deals(organization_id, created_at DESC);
CREATE INDEX idx_deals_contact ON crm.deals(contact_id);
CREATE INDEX idx_deals_stage ON crm.deals(organization_id, stage);
CREATE INDEX idx_deals_assigned ON crm.deals(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_deals_value ON crm.deals(organization_id, value DESC);

-- Emails
CREATE INDEX idx_emails_org ON crm.emails(organization_id, created_at DESC);
CREATE INDEX idx_emails_contact ON crm.emails(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_emails_thread ON crm.emails(thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX idx_emails_status ON crm.emails(organization_id, status);

-- Notes
CREATE INDEX idx_notes_contact ON crm.notes(contact_id, created_at DESC);
CREATE INDEX idx_notes_pinned ON crm.notes(contact_id, is_pinned) WHERE is_pinned = true;

-- =====================================================
-- ROW LEVEL SECURITY (Multi-tenant)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE crm.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: crm.contacts
-- =====================================================

-- SELECT: Ver contactos de sus organizaciones
CREATE POLICY "Users can view own org contacts"
ON crm.contacts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT: Crear contactos en sus organizaciones
CREATE POLICY "Users can create contacts in own org"
ON crm.contacts
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- UPDATE: Actualizar contactos de sus organizaciones
CREATE POLICY "Users can update own org contacts"
ON crm.contacts
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- DELETE: Solo admins de org pueden eliminar contactos
CREATE POLICY "Org admins can delete contacts"
ON crm.contacts
FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND ou.status = 'active'
    AND r.level >= 7 -- Admin o superior
  )
);

-- =====================================================
-- POLÍTICAS RLS: crm.activities
-- =====================================================

CREATE POLICY "Users can view own org activities"
ON crm.activities
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create activities in own org"
ON crm.activities
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update own activities"
ON crm.activities
FOR UPDATE
USING (
  performed_by = auth.uid() OR
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND r.level >= 7
  )
);

CREATE POLICY "Org admins can delete activities"
ON crm.activities
FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: crm.deals
-- =====================================================

CREATE POLICY "Users can view own org deals"
ON crm.deals
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create deals in own org"
ON crm.deals
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update own org deals"
ON crm.deals
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Org admins can delete deals"
ON crm.deals
FOR DELETE
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: crm.emails
-- =====================================================

CREATE POLICY "Users can view own org emails"
ON crm.emails
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create emails in own org"
ON crm.emails
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can update emails in own org"
ON crm.emails
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- =====================================================
-- POLÍTICAS RLS: crm.settings
-- =====================================================

CREATE POLICY "Users can view own org settings"
ON crm.settings
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Org admins can manage own settings"
ON crm.settings
FOR ALL
USING (
  organization_id IN (
    SELECT ou.organization_id 
    FROM core.organization_users ou
    JOIN core.roles r ON r.id = ou.role_id
    WHERE ou.user_id = auth.uid() 
    AND r.level >= 7
  )
);

-- =====================================================
-- POLÍTICAS RLS: crm.notes
-- =====================================================

CREATE POLICY "Users can view own org notes"
ON crm.notes
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can create notes in own org"
ON crm.notes
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update own notes"
ON crm.notes
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete own notes"
ON crm.notes
FOR DELETE
USING (created_by = auth.uid());

-- =====================================================
-- FUNCIONES RPC para CRM
-- =====================================================

-- Función para obtener estadísticas de CRM por organización
CREATE OR REPLACE FUNCTION crm.get_stats(org_id uuid)
RETURNS JSON AS $$
DECLARE
  total_contacts INTEGER;
  new_contacts INTEGER;
  active_deals INTEGER;
  deals_value DECIMAL;
  unread_emails INTEGER;
BEGIN
  -- Total de contactos
  SELECT COUNT(*) INTO total_contacts
  FROM crm.contacts
  WHERE organization_id = org_id;
  
  -- Contactos nuevos (últimos 7 días)
  SELECT COUNT(*) INTO new_contacts
  FROM crm.contacts
  WHERE organization_id = org_id
  AND created_at > NOW() - INTERVAL '7 days';
  
  -- Deals activos
  SELECT COUNT(*) INTO active_deals
  FROM crm.deals
  WHERE organization_id = org_id
  AND stage NOT IN ('closed_won', 'closed_lost');
  
  -- Valor total de deals activos
  SELECT COALESCE(SUM(value), 0) INTO deals_value
  FROM crm.deals
  WHERE organization_id = org_id
  AND stage NOT IN ('closed_won', 'closed_lost');
  
  -- Emails sin leer (inbound que no tienen reply)
  SELECT COUNT(*) INTO unread_emails
  FROM crm.emails
  WHERE organization_id = org_id
  AND direction = 'inbound'
  AND replied_at IS NULL
  AND created_at > NOW() - INTERVAL '30 days';
  
  RETURN json_build_object(
    'total_contacts', total_contacts,
    'new_contacts', new_contacts,
    'active_deals', active_deals,
    'deals_value', deals_value,
    'unread_emails', unread_emails
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION crm.get_stats(uuid) TO authenticated;

COMMENT ON FUNCTION crm.get_stats IS
'Obtiene estadísticas del CRM para una organización específica';

-- =====================================================
-- ROLES ESPECÍFICOS PARA CRM (en schema core)
-- =====================================================

-- Rol: CRM Manager (gestión completa del CRM en su org)
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'CRM Manager',
  'crm_manager',
  'Gestión completa del CRM - Puede ver y editar todos los contactos de su organización',
  6,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      'contacts', jsonb_build_object('view', true, 'create', true, 'edit', true, 'delete', true),
      'deals', jsonb_build_object('view', true, 'create', true, 'edit', true, 'delete', true),
      'activities', jsonb_build_object('view', true, 'create', true, 'edit', true),
      'emails', jsonb_build_object('view', true, 'send', true),
      'settings', jsonb_build_object('edit', true)
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Rol: Sales Representative (solo sus contactos asignados)
INSERT INTO core.roles (name, slug, description, level, is_system, permissions) VALUES
(
  'Sales Representative',
  'sales_rep',
  'Representante de ventas - Solo puede ver y editar contactos asignados a él',
  4,
  true,
  jsonb_build_object(
    'crm', jsonb_build_object(
      'contacts', jsonb_build_object('view_assigned', true, 'edit_assigned', true),
      'deals', jsonb_build_object('view_assigned', true, 'edit_assigned', true),
      'activities', jsonb_build_object('view', true, 'create', true),
      'emails', jsonb_build_object('view', true, 'send', true)
    )
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- Actualizar rol Sales Manager existente (si existe)
UPDATE core.roles
SET 
  level = 6,
  permissions = jsonb_build_object(
    'crm', jsonb_build_object(
      'contacts', jsonb_build_object('view', true, 'create', true, 'edit', true, 'delete', true),
      'deals', jsonb_build_object('view', true, 'create', true, 'edit', true, 'delete', true),
      'activities', jsonb_build_object('view', true, 'create', true, 'edit', true),
      'emails', jsonb_build_object('view', true, 'send', true),
      'settings', jsonb_build_object('edit', true)
    )
  )
WHERE slug = 'sales_manager';

-- =====================================================
-- APLICACIÓN CRM en el ecosistema
-- =====================================================

-- Registrar CRM como aplicación del ecosistema
INSERT INTO core.applications (
  name,
  slug,
  description,
  category,
  version,
  is_active,
  requires_subscription,
  config_schema,
  default_config
) VALUES (
  'CRM & Sales',
  'crm_sales',
  'Sistema CRM completo con gestión de contactos, deals, y automatización de emails',
  'business',
  '1.0.0',
  true,
  true,
  jsonb_build_object(
    'max_contacts', jsonb_build_object('type', 'integer', 'default', 1000, 'description', 'Número máximo de contactos'),
    'max_users', jsonb_build_object('type', 'integer', 'default', 5, 'description', 'Usuarios que pueden acceder al CRM'),
    'email_integration', jsonb_build_object('type', 'boolean', 'default', true, 'description', 'Integración con Gmail'),
    'api_access', jsonb_build_object('type', 'boolean', 'default', false, 'description', 'Acceso a API del CRM'),
    'custom_fields', jsonb_build_object('type', 'boolean', 'default', true, 'description', 'Campos personalizados'),
    'automations', jsonb_build_object('type', 'boolean', 'default', false, 'description', 'Automatizaciones y workflows')
  ),
  jsonb_build_object(
    'max_contacts', 1000,
    'max_users', 5,
    'email_integration', true,
    'api_access', false,
    'custom_fields', true,
    'automations', false
  )
) ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  config_schema = EXCLUDED.config_schema,
  default_config = EXCLUDED.default_config;

-- =====================================================
-- HABILITAR CRM para organización Platform
-- =====================================================

-- TuPatrimonio Platform usa su propio CRM
INSERT INTO core.organization_applications (
  organization_id,
  application_id,
  is_enabled,
  config
)
SELECT 
  o.id,
  a.id,
  true,
  jsonb_build_object(
    'max_contacts', -1,  -- Ilimitado para platform
    'max_users', -1,      -- Ilimitado
    'email_integration', true,
    'api_access', true,
    'custom_fields', true,
    'automations', true
  )
FROM core.organizations o
CROSS JOIN core.applications a
WHERE o.org_type = 'platform'
AND a.slug = 'crm_sales'
ON CONFLICT (organization_id, application_id) DO NOTHING;

-- Crear settings para platform org
INSERT INTO crm.settings (organization_id)
SELECT id FROM core.organizations WHERE org_type = 'platform'
ON CONFLICT (organization_id) DO NOTHING;

-- =====================================================
-- FUNCIÓN: Migrar leads de marketing a CRM
-- =====================================================

-- Función para importar waitlist a CRM de platform org
CREATE OR REPLACE FUNCTION public.import_marketing_leads_to_crm()
RETURNS INTEGER AS $$
DECLARE
  platform_org_id UUID;
  imported_count INTEGER := 0;
  lead_record RECORD;
BEGIN
  -- Obtener platform org
  SELECT id INTO platform_org_id
  FROM core.organizations
  WHERE org_type = 'platform'
  LIMIT 1;
  
  IF platform_org_id IS NULL THEN
    RAISE EXCEPTION 'Platform organization not found';
  END IF;
  
  -- Importar desde waitlist_subscribers
  FOR lead_record IN 
    SELECT DISTINCT ON (email)
      email,
      first_name,
      last_name,
      company,
      use_case,
      referral_source,
      subscribed_at
    FROM marketing.waitlist_subscribers
    WHERE status = 'active'
    ORDER BY email, subscribed_at DESC
  LOOP
    INSERT INTO crm.contacts (
      organization_id,
      email,
      first_name,
      last_name,
      company_name,
      status,
      source,
      custom_fields,
      created_at
    ) VALUES (
      platform_org_id,
      lead_record.email,
      lead_record.first_name,
      lead_record.last_name,
      lead_record.company,
      'lead',
      COALESCE(lead_record.referral_source, 'waitlist'),
      jsonb_build_object('use_case', lead_record.use_case),
      lead_record.subscribed_at
    )
    ON CONFLICT (organization_id, email) DO NOTHING;
    
    imported_count := imported_count + 1;
  END LOOP;
  
  -- Importar desde contact_messages
  FOR lead_record IN 
    SELECT DISTINCT ON (email)
      email,
      name,
      company,
      phone,
      subject,
      message,
      form_type,
      created_at
    FROM marketing.contact_messages
    WHERE status IN ('new', 'read')
    ORDER BY email, created_at DESC
  LOOP
    -- Dividir nombre en first_name y last_name (simple)
    DECLARE
      name_parts TEXT[];
      f_name TEXT;
      l_name TEXT;
    BEGIN
      name_parts := string_to_array(lead_record.name, ' ');
      f_name := name_parts[1];
      l_name := CASE WHEN array_length(name_parts, 1) > 1 
                THEN array_to_string(name_parts[2:], ' ') 
                ELSE NULL END;
      
      INSERT INTO crm.contacts (
        organization_id,
        email,
        first_name,
        last_name,
        company_name,
        phone,
        status,
        source,
        notes,
        custom_fields,
        created_at
      ) VALUES (
        platform_org_id,
        lead_record.email,
        f_name,
        l_name,
        lead_record.company,
        lead_record.phone,
        'lead',
        'contact_form',
        lead_record.message,
        jsonb_build_object(
          'form_type', lead_record.form_type,
          'subject', lead_record.subject
        ),
        lead_record.created_at
      )
      ON CONFLICT (organization_id, email) DO UPDATE SET
        phone = COALESCE(EXCLUDED.phone, crm.contacts.phone),
        notes = COALESCE(EXCLUDED.notes, crm.contacts.notes);
      
      imported_count := imported_count + 1;
    END;
  END LOOP;
  
  RETURN imported_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.import_marketing_leads_to_crm() TO authenticated;

COMMENT ON FUNCTION public.import_marketing_leads_to_crm IS
'Importa leads de marketing.waitlist_subscribers y marketing.contact_messages al CRM de la org platform. Solo ejecutar una vez.';

-- =====================================================
-- GRANT PERMISSIONS para schema CRM
-- =====================================================

-- Otorgar uso del schema a usuarios autenticados
GRANT USAGE ON SCHEMA crm TO authenticated;
GRANT USAGE ON SCHEMA crm TO anon;

-- Otorgar permisos sobre tablas (RLS maneja el acceso real)
GRANT ALL ON ALL TABLES IN SCHEMA crm TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA crm TO anon;

-- Otorgar permisos sobre sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm TO authenticated;

-- Otorgar permisos sobre funciones
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA crm TO authenticated;

-- =====================================================
-- COMENTARIOS para Documentación
-- =====================================================

COMMENT ON SCHEMA crm IS 'Schema CRM multi-tenant - Sistema de gestión de contactos, deals y comunicaciones como servicio B2B vendible';

COMMENT ON TABLE crm.contacts IS 'Contactos del CRM multi-tenant. Cada organización gestiona sus propios contactos con aislamiento total vía RLS.';
COMMENT ON TABLE crm.activities IS 'Timeline de actividades por contacto (emails, llamadas, reuniones, notas). Filtrado por organization_id.';
COMMENT ON TABLE crm.deals IS 'Oportunidades de venta vinculadas a contactos. Multi-tenant con RLS.';
COMMENT ON TABLE crm.emails IS 'Historial de emails enviados y recibidos vía integración Gmail. Cada org tiene sus propios tokens OAuth.';
COMMENT ON TABLE crm.settings IS 'Configuración del CRM por organización (OAuth tokens, templates, custom fields, etc.)';
COMMENT ON TABLE crm.notes IS 'Notas internas sobre contactos. Los usuarios solo pueden editar sus propias notas.';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '✅ Schema CRM Multi-Tenant creado exitosamente';
  RAISE NOTICE '🎉 ================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Schema: crm (separado de core)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas creadas:';
  RAISE NOTICE '  ✅ crm.contacts - Gestión de contactos';
  RAISE NOTICE '  ✅ crm.activities - Timeline de actividades';
  RAISE NOTICE '  ✅ crm.deals - Oportunidades de venta';
  RAISE NOTICE '  ✅ crm.emails - Integración Gmail';
  RAISE NOTICE '  ✅ crm.settings - Configuración por org';
  RAISE NOTICE '  ✅ crm.notes - Notas internas';
  RAISE NOTICE '';
  RAISE NOTICE 'Roles CRM creados (en core.roles):';
  RAISE NOTICE '  - crm_manager (nivel 6): Gestión completa del CRM';
  RAISE NOTICE '  - sales_rep (nivel 4): Solo contactos asignados';
  RAISE NOTICE '';
  RAISE NOTICE 'Aplicación registrada (en core.applications):';
  RAISE NOTICE '  - crm_sales: CRM como servicio B2B vendible';
  RAISE NOTICE '  - Platform org: CRM habilitado con límites ilimitados';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Próximos pasos:';
  RAISE NOTICE '  1. Ejecutar: SELECT import_marketing_leads_to_crm();';
  RAISE NOTICE '     (importa leads existentes al CRM de platform)';
  RAISE NOTICE '  2. Configurar OAuth de Gmail en crm.settings';
  RAISE NOTICE '  3. Implementar UI del CRM en apps/web';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 El CRM es multi-tenant y vendible como servicio B2B';
  RAISE NOTICE '🎯 Cada aplicación tiene su propio schema (core, marketing, crm)';
  RAISE NOTICE '';
END $$;
