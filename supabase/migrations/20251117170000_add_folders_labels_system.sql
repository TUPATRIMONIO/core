/**
 * Migración: Sistema de Carpetas y Etiquetas Tipo Gmail
 * 
 * Permite organizar emails en carpetas (Inbox, Sent, Archived, Custom)
 * y aplicar múltiples etiquetas para mejor organización.
 * 
 * Fecha: 17 Noviembre 2025
 */

-- ============================================================================
-- 1. TABLA: folders (Carpetas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Información de la carpeta
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'custom')),
  icon TEXT, -- Nombre de ícono lucide o emoji
  color TEXT, -- Color hex para UI
  
  -- Configuración
  is_default BOOLEAN DEFAULT false, -- Carpeta por defecto (Inbox)
  sort_order INTEGER DEFAULT 0, -- Orden de visualización
  
  -- Metadatos
  created_by UUID REFERENCES core.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

COMMENT ON TABLE crm.folders IS 'Carpetas para organizar emails (sistema y personalizadas)';
COMMENT ON COLUMN crm.folders.type IS 'system: carpetas predefinidas (Inbox, Sent, etc), custom: creadas por usuario';

-- ============================================================================
-- 2. TABLA: thread_labels (Relación Threads-Carpetas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm.thread_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  thread_id UUID NOT NULL REFERENCES crm.email_threads(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES crm.folders(id) ON DELETE CASCADE,
  
  -- Metadatos
  labeled_by UUID REFERENCES core.users(id),
  labeled_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(thread_id, folder_id)
);

COMMENT ON TABLE crm.thread_labels IS 'Relación muchos-a-muchos entre threads y carpetas/etiquetas';

-- ============================================================================
-- 3. FUNCIÓN: Crear Carpetas del Sistema
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.create_system_folders(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Inbox (por defecto)
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Inbox', 'system', 'Inbox', '#3b82f6', true, 1)
  ON CONFLICT (organization_id, name) DO NOTHING;
  
  -- Sent
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Sent', 'system', 'Send', '#10b981', false, 2)
  ON CONFLICT (organization_id, name) DO NOTHING;
  
  -- Archived
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Archived', 'system', 'Archive', '#6b7280', false, 3)
  ON CONFLICT (organization_id, name) DO NOTHING;
  
  -- Spam
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Spam', 'system', 'AlertOctagon', '#ef4444', false, 4)
  ON CONFLICT (organization_id, name) DO NOTHING;
  
  -- Trash
  INSERT INTO crm.folders (organization_id, name, type, icon, color, is_default, sort_order)
  VALUES (org_id, 'Trash', 'system', 'Trash2', '#dc2626', false, 5)
  ON CONFLICT (organization_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Crear carpetas para organizaciones existentes
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM core.organizations LOOP
    PERFORM crm.create_system_folders(org_record.id);
  END LOOP;
END $$;

-- ============================================================================
-- 4. TRIGGER: Auto-crear carpetas para nuevas organizaciones
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.auto_create_folders_for_new_org()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM crm.create_system_folders(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_folders_for_new_org
  AFTER INSERT ON core.organizations
  FOR EACH ROW
  EXECUTE FUNCTION crm.auto_create_folders_for_new_org();

-- ============================================================================
-- 5. FUNCIÓN: Obtener Threads por Carpeta
-- ============================================================================

CREATE OR REPLACE FUNCTION crm.get_threads_by_folder(
  org_id UUID,
  folder_name TEXT,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  gmail_thread_id TEXT,
  contact_id UUID,
  subject TEXT,
  snippet TEXT,
  participants TEXT[],
  status TEXT,
  is_read BOOLEAN,
  email_count INTEGER,
  last_email_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id,
    et.organization_id,
    et.gmail_thread_id,
    et.contact_id,
    et.subject,
    et.snippet,
    et.participants,
    et.status,
    et.is_read,
    et.email_count,
    et.last_email_at
  FROM crm.email_threads et
  JOIN crm.thread_labels tl ON tl.thread_id = et.id
  JOIN crm.folders f ON f.id = tl.folder_id
  WHERE et.organization_id = org_id
  AND f.name = folder_name
  ORDER BY et.last_email_at DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_folders_org ON crm.folders(organization_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_folders_type ON crm.folders(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_thread_labels_thread ON crm.thread_labels(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_labels_folder ON crm.thread_labels(folder_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE crm.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm.thread_labels ENABLE ROW LEVEL SECURITY;

-- Políticas para folders
CREATE POLICY "Users can view folders in their org"
  ON crm.folders FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can manage custom folders in their org"
  ON crm.folders FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND type = 'custom'
  );

-- Políticas para thread_labels
CREATE POLICY "Users can view thread labels in their org"
  ON crm.thread_labels FOR SELECT
  USING (
    thread_id IN (
      SELECT id FROM crm.email_threads
      WHERE organization_id IN (
        SELECT organization_id FROM core.organization_users
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

CREATE POLICY "Users can manage thread labels in their org"
  ON crm.thread_labels FOR ALL
  USING (
    thread_id IN (
      SELECT id FROM crm.email_threads
      WHERE organization_id IN (
        SELECT organization_id FROM core.organization_users
        WHERE user_id = auth.uid() AND status = 'active'
      )
    )
  );

