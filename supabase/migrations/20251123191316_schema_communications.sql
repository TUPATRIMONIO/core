/**
 * Migración: Schema Communications - Sistema de Comunicaciones Avanzadas
 * 
 * Descripción: Sistema completo de comunicaciones con email marketing masivo,
 * campañas, templates, notificaciones mejoradas y reportes básicos del CRM.
 * 
 * Características:
 * - Multi-tenant estricto por organization_id
 * - Integración SendGrid por organización (cuenta independiente)
 * - Templates con variables dinámicas (Handlebars)
 * - Campañas de email marketing con tracking completo
 * - Sistema de notificaciones mejorado con Realtime
 * 
 * Fecha: 23 Noviembre 2025
 */

-- ============================================================================
-- 1. CREAR SCHEMA COMMUNICATIONS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS communications;

-- Set search path
SET search_path TO communications, crm, core, public, extensions;

-- ============================================================================
-- 2. ENUMS
-- ============================================================================

-- Estado de campañas
CREATE TYPE communications.campaign_status AS ENUM (
  'draft',        -- Borrador
  'scheduled',    -- Programada
  'sending',      -- Enviando
  'sent',         -- Enviada
  'paused',       -- Pausada
  'cancelled'    -- Cancelada
);

-- Tipo de template
CREATE TYPE communications.template_type AS ENUM (
  'email',        -- Email
  'sms',          -- SMS (futuro)
  'whatsapp'      -- WhatsApp (futuro)
);

-- Tipo de evento de mensaje
CREATE TYPE communications.message_event_type AS ENUM (
  'delivered',    -- Entregado
  'opened',       -- Abierto
  'clicked',      -- Click en link
  'replied',      -- Respondido
  'bounced',      -- Rebotado
  'failed',       -- Fallido
  'unsubscribed'  -- Desuscrito
);

-- Tipo de notificación
CREATE TYPE communications.notification_type AS ENUM (
  'campaign_sent',        -- Campaña enviada
  'email_opened',         -- Email abierto
  'email_clicked',        -- Email con click
  'deal_won',            -- Deal ganado
  'ticket_assigned',      -- Ticket asignado
  'ticket_closed',        -- Ticket cerrado
  'quote_sent',           -- Cotización enviada
  'quote_signed',         -- Cotización firmada
  'system',              -- Notificación del sistema
  'credit_low',          -- Créditos bajos
  'payment_failed'       -- Pago fallido
);

-- Canal de notificación
CREATE TYPE communications.notification_channel AS ENUM (
  'in_app',      -- Solo in-app
  'email',       -- Email
  'sms',         -- SMS (futuro)
  'push'         -- Push notification (futuro)
);

-- ============================================================================
-- 3. TABLAS PRINCIPALES
-- ============================================================================

-- =====================================================
-- 3.1 CUENTAS SENDGRID POR ORGANIZACIÓN
-- =====================================================

CREATE TABLE communications.sendgrid_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Credenciales SendGrid (API key encriptada)
  api_key TEXT NOT NULL, -- Encriptado con AES-256-GCM
  
  -- Configuración de envío
  from_email TEXT NOT NULL CHECK (from_email ~ '^[^@]+@[^@]+\.[^@]+$'),
  from_name TEXT NOT NULL CHECK (length(from_name) <= 100),
  
  -- Estado y verificación
  is_active BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  
  -- Estadísticas de uso
  emails_sent_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_org_sendgrid UNIQUE (organization_id)
);

COMMENT ON TABLE communications.sendgrid_accounts IS 'Cuentas SendGrid por organización - API keys encriptadas';
COMMENT ON COLUMN communications.sendgrid_accounts.api_key IS 'API key de SendGrid encriptada con AES-256-GCM';

-- =====================================================
-- 3.2 LISTAS DE CONTACTOS
-- =====================================================

CREATE TABLE communications.contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  description TEXT CHECK (length(description) <= 1000),
  
  -- Estadísticas
  contact_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_list_name_per_org UNIQUE (organization_id, name)
);

COMMENT ON TABLE communications.contact_lists IS 'Listas de contactos para campañas de email marketing';

-- =====================================================
-- 3.3 MIEMBROS DE LISTAS (M:N)
-- =====================================================

CREATE TABLE communications.contact_list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  contact_list_id UUID NOT NULL REFERENCES communications.contact_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Metadata
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES core.users(id),
  
  -- Constraints
  CONSTRAINT unique_contact_in_list UNIQUE (contact_list_id, contact_id)
);

COMMENT ON TABLE communications.contact_list_members IS 'Relación M:N entre listas y contactos del CRM';

-- =====================================================
-- 3.4 TEMPLATES DE MENSAJES
-- =====================================================

CREATE TABLE communications.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  description TEXT CHECK (length(description) <= 500),
  
  -- Tipo y contenido
  type communications.template_type NOT NULL DEFAULT 'email',
  subject TEXT NOT NULL CHECK (length(subject) <= 200),
  body_html TEXT NOT NULL,
  body_text TEXT, -- Versión texto plano (opcional)
  
  -- Variables disponibles (para Handlebars)
  variables JSONB DEFAULT '{}', -- Ej: {"user_name": "Nombre del usuario", "contact_email": "Email del contacto"}
  
  -- Versionado
  version INTEGER NOT NULL DEFAULT 1,
  parent_template_id UUID REFERENCES communications.message_templates(id), -- Template padre si es versión
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Estadísticas de uso
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
);

COMMENT ON TABLE communications.message_templates IS 'Templates de mensajes reutilizables con soporte para variables dinámicas (Handlebars)';
COMMENT ON COLUMN communications.message_templates.variables IS 'Descripción de variables disponibles para el template (ej: {{user.name}}, {{contact.email}})';

-- =====================================================
-- 3.5 CAMPAÑAS DE EMAIL MARKETING
-- =====================================================

CREATE TABLE communications.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenancy
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información básica
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 200),
  description TEXT CHECK (length(description) <= 1000),
  
  -- Configuración
  template_id UUID NOT NULL REFERENCES communications.message_templates(id),
  contact_list_id UUID NOT NULL REFERENCES communications.contact_lists(id),
  
  -- Estado y programación
  status communications.campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Estadísticas
  total_recipients INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_delivered INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  emails_failed INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id)
);

COMMENT ON TABLE communications.campaigns IS 'Campañas de email marketing con tracking completo';

-- =====================================================
-- 3.6 MENSAJES DE CAMPAÑA
-- =====================================================

CREATE TABLE communications.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  campaign_id UUID NOT NULL REFERENCES communications.campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  
  -- Información del mensaje
  sendgrid_message_id TEXT, -- ID del mensaje en SendGrid
  email_address TEXT NOT NULL CHECK (email_address ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Estado
  status crm.email_status NOT NULL DEFAULT 'draft',
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE communications.campaign_messages IS 'Mensajes individuales enviados en campañas con tracking detallado';

-- =====================================================
-- 3.7 EVENTOS DE MENSAJES
-- =====================================================

CREATE TABLE communications.message_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  campaign_message_id UUID REFERENCES communications.campaign_messages(id) ON DELETE CASCADE,
  
  -- Información del evento
  event_type communications.message_event_type NOT NULL,
  sendgrid_event_id TEXT, -- ID del evento en SendGrid
  
  -- Datos del evento
  event_data JSONB DEFAULT '{}', -- Datos adicionales del evento (IP, user agent, etc.)
  
  -- Metadata
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE communications.message_events IS 'Eventos de mensajes desde SendGrid webhooks (delivered, opened, clicked, bounced, etc.)';

-- =====================================================
-- 3.8 NOTIFICACIONES DE USUARIO
-- =====================================================

CREATE TABLE communications.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario destinatario
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Organización relacionada (opcional)
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información de la notificación
  type communications.notification_type NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  message TEXT NOT NULL CHECK (length(message) <= 1000),
  link TEXT, -- Link opcional (ej: /crm/deals/123)
  
  -- Estado
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE communications.user_notifications IS 'Notificaciones in-app mejoradas para usuarios';

-- =====================================================
-- 3.9 PREFERENCIAS DE NOTIFICACIÓN
-- =====================================================

CREATE TABLE communications.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  
  -- Tipo de notificación
  notification_type communications.notification_type NOT NULL,
  
  -- Canales habilitados
  channels communications.notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::communications.notification_channel[],
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_notification_type UNIQUE (user_id, notification_type)
);

COMMENT ON TABLE communications.notification_preferences IS 'Preferencias de notificación por usuario y tipo';

-- ============================================================================
-- 4. ÍNDICES
-- ============================================================================

-- SendGrid Accounts
CREATE INDEX idx_sendgrid_accounts_org ON communications.sendgrid_accounts(organization_id) WHERE is_active = true;
CREATE INDEX idx_sendgrid_accounts_active ON communications.sendgrid_accounts(is_active) WHERE is_active = true;

-- Contact Lists
CREATE INDEX idx_contact_lists_org ON communications.contact_lists(organization_id, created_at DESC);
CREATE INDEX idx_contact_lists_name ON communications.contact_lists(organization_id, name);

-- Contact List Members
CREATE INDEX idx_list_members_list ON communications.contact_list_members(contact_list_id);
CREATE INDEX idx_list_members_contact ON communications.contact_list_members(contact_id);
CREATE INDEX idx_list_members_unique ON communications.contact_list_members(contact_list_id, contact_id);

-- Message Templates
CREATE INDEX idx_templates_org ON communications.message_templates(organization_id, created_at DESC);
CREATE INDEX idx_templates_active ON communications.message_templates(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_templates_type ON communications.message_templates(organization_id, type);

-- Campaigns
CREATE INDEX idx_campaigns_org ON communications.campaigns(organization_id, created_at DESC);
CREATE INDEX idx_campaigns_status ON communications.campaigns(organization_id, status);
CREATE INDEX idx_campaigns_scheduled ON communications.campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_campaigns_template ON communications.campaigns(template_id);
CREATE INDEX idx_campaigns_list ON communications.campaigns(contact_list_id);

-- Campaign Messages
CREATE INDEX idx_campaign_messages_campaign ON communications.campaign_messages(campaign_id, created_at DESC);
CREATE INDEX idx_campaign_messages_contact ON communications.campaign_messages(contact_id);
CREATE INDEX idx_campaign_messages_status ON communications.campaign_messages(campaign_id, status);
CREATE INDEX idx_campaign_messages_sendgrid_id ON communications.campaign_messages(sendgrid_message_id) WHERE sendgrid_message_id IS NOT NULL;

-- Message Events
CREATE INDEX idx_message_events_campaign_msg ON communications.message_events(campaign_message_id, occurred_at DESC);
CREATE INDEX idx_message_events_type ON communications.message_events(event_type, occurred_at DESC);
CREATE INDEX idx_message_events_sendgrid_id ON communications.message_events(sendgrid_event_id) WHERE sendgrid_event_id IS NOT NULL;

-- User Notifications
CREATE INDEX idx_user_notifications_user ON communications.user_notifications(user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread ON communications.user_notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_notifications_type ON communications.user_notifications(user_id, type);
CREATE INDEX idx_user_notifications_org ON communications.user_notifications(organization_id) WHERE organization_id IS NOT NULL;

-- Notification Preferences
CREATE INDEX idx_notification_prefs_user ON communications.notification_preferences(user_id);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION communications.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER trigger_sendgrid_accounts_updated_at
  BEFORE UPDATE ON communications.sendgrid_accounts
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

CREATE TRIGGER trigger_contact_lists_updated_at
  BEFORE UPDATE ON communications.contact_lists
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

CREATE TRIGGER trigger_message_templates_updated_at
  BEFORE UPDATE ON communications.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON communications.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

CREATE TRIGGER trigger_campaign_messages_updated_at
  BEFORE UPDATE ON communications.campaign_messages
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON communications.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_updated_at();

-- Trigger para actualizar contador de contactos en lista
CREATE OR REPLACE FUNCTION communications.update_list_contact_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communications.contact_lists
    SET contact_count = contact_count + 1
    WHERE id = NEW.contact_list_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communications.contact_lists
    SET contact_count = GREATEST(0, contact_count - 1)
    WHERE id = OLD.contact_list_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_list_contact_count
  AFTER INSERT OR DELETE ON communications.contact_list_members
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_list_contact_count();

-- Trigger para actualizar estadísticas de campaña desde mensajes
CREATE OR REPLACE FUNCTION communications.update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Actualizar estadísticas de la campaña basado en cambios de estado
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE communications.campaigns
      SET 
        emails_sent = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status IN ('sent', 'delivered', 'opened', 'clicked', 'replied')
        ),
        emails_delivered = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status IN ('delivered', 'opened', 'clicked', 'replied')
        ),
        emails_opened = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status IN ('opened', 'clicked', 'replied')
        ),
        emails_clicked = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status IN ('clicked', 'replied')
        ),
        emails_bounced = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status = 'bounced'
        ),
        emails_failed = (
          SELECT COUNT(*) FROM communications.campaign_messages
          WHERE campaign_id = NEW.campaign_id AND status = 'failed'
        )
      WHERE id = NEW.campaign_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_stats
  AFTER UPDATE ON communications.campaign_messages
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_campaign_stats();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE communications.sendgrid_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications.notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6.1 POLÍTICAS: sendgrid_accounts
-- =====================================================

-- SELECT: Ver cuenta SendGrid de su organización
CREATE POLICY "Users can view own org sendgrid account"
ON communications.sendgrid_accounts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

-- INSERT/UPDATE/DELETE: Solo owners/admins pueden gestionar
CREATE POLICY "Owners can manage sendgrid account"
ON communications.sendgrid_accounts
FOR ALL
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

-- Platform admins pueden ver todas las cuentas
CREATE POLICY "Platform admins can view all sendgrid accounts"
ON communications.sendgrid_accounts
FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- 6.2 POLÍTICAS: contact_lists
-- =====================================================

CREATE POLICY "Users can view own org contact lists"
ON communications.contact_lists
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can manage own org contact lists"
ON communications.contact_lists
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Platform admins can view all contact lists"
ON communications.contact_lists
FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- 6.3 POLÍTICAS: contact_list_members
-- =====================================================

CREATE POLICY "Users can view own org list members"
ON communications.contact_list_members
FOR SELECT
USING (
  contact_list_id IN (
    SELECT id FROM communications.contact_lists
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

CREATE POLICY "Users can manage own org list members"
ON communications.contact_list_members
FOR ALL
USING (
  contact_list_id IN (
    SELECT id FROM communications.contact_lists
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- =====================================================
-- 6.4 POLÍTICAS: message_templates
-- =====================================================

CREATE POLICY "Users can view own org templates"
ON communications.message_templates
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can manage own org templates"
ON communications.message_templates
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Platform admins can view all templates"
ON communications.message_templates
FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- 6.5 POLÍTICAS: campaigns
-- =====================================================

CREATE POLICY "Users can view own org campaigns"
ON communications.campaigns
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Users can manage own org campaigns"
ON communications.campaigns
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM core.organization_users 
    WHERE user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Platform admins can view all campaigns"
ON communications.campaigns
FOR SELECT
USING (public.is_platform_super_admin(auth.uid()));

-- =====================================================
-- 6.6 POLÍTICAS: campaign_messages
-- =====================================================

CREATE POLICY "Users can view own org campaign messages"
ON communications.campaign_messages
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM communications.campaigns
    WHERE organization_id IN (
      SELECT organization_id 
      FROM core.organization_users 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  )
);

-- =====================================================
-- 6.7 POLÍTICAS: message_events
-- =====================================================

CREATE POLICY "Users can view own org message events"
ON communications.message_events
FOR SELECT
USING (
  campaign_message_id IN (
    SELECT id FROM communications.campaign_messages
    WHERE campaign_id IN (
      SELECT id FROM communications.campaigns
      WHERE organization_id IN (
        SELECT organization_id 
        FROM core.organization_users 
        WHERE user_id = auth.uid() 
        AND status = 'active'
      )
    )
  )
);

-- =====================================================
-- 6.8 POLÍTICAS: user_notifications
-- =====================================================

CREATE POLICY "Users can view own notifications"
ON communications.user_notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON communications.user_notifications
FOR UPDATE
USING (user_id = auth.uid());

-- =====================================================
-- 6.9 POLÍTICAS: notification_preferences
-- =====================================================

CREATE POLICY "Users can manage own notification preferences"
ON communications.notification_preferences
FOR ALL
USING (user_id = auth.uid());

-- ============================================================================
-- 7. FUNCIONES HELPER
-- ============================================================================

-- Función para obtener cuenta SendGrid activa de una organización
CREATE OR REPLACE FUNCTION communications.get_active_sendgrid_account(org_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  from_email TEXT,
  from_name TEXT,
  is_active BOOLEAN,
  verified_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.organization_id,
    sa.from_email,
    sa.from_name,
    sa.is_active,
    sa.verified_at
  FROM communications.sendgrid_accounts sa
  WHERE sa.organization_id = org_id
  AND sa.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION communications.get_active_sendgrid_account IS 'Obtiene la cuenta SendGrid activa de una organización';

-- Función para verificar si una organización tiene cuenta SendGrid configurada
CREATE OR REPLACE FUNCTION communications.has_sendgrid_account(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM communications.sendgrid_accounts
    WHERE organization_id = org_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION communications.has_sendgrid_account IS 'Verifica si una organización tiene cuenta SendGrid configurada y activa';

-- ============================================================================
-- 8. COMENTARIOS FINALES
-- ============================================================================

COMMENT ON SCHEMA communications IS 'Sistema de comunicaciones avanzadas con email marketing masivo, campañas, templates y notificaciones mejoradas';

