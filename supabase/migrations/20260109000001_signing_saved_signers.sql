-- =====================================================
-- Migration: Create saved signers system
-- Description: Permite a los usuarios guardar firmantes frecuentes para reutilizarlos
-- Created: 2026-01-09
-- =====================================================

SET search_path TO signing, core, public, extensions;

-- 1. Crear tabla de firmantes guardados
CREATE TABLE IF NOT EXISTS signing.saved_signers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Tipo de guardado
  type TEXT NOT NULL CHECK (type IN ('personal', 'organization')),
  
  -- Datos del firmante
  email TEXT NOT NULL CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  first_name TEXT NOT NULL CHECK (length(first_name) >= 1),
  last_name TEXT NOT NULL CHECK (length(last_name) >= 1),
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone TEXT,
  
  -- Identificación
  identifier_type TEXT NOT NULL DEFAULT 'rut' CHECK (identifier_type IN ('rut', 'passport', 'other')),
  identifier_value TEXT NOT NULL CHECK (length(identifier_value) >= 5),
  
  -- Metadata y estadísticas
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT user_id_required_for_personal CHECK (
    (type = 'personal' AND user_id IS NOT NULL) OR 
    (type = 'organization' AND organization_id IS NOT NULL)
  )
);

-- 2. Índices únicos parciales para evitar duplicados por tipo
CREATE UNIQUE INDEX idx_saved_signers_unique_personal 
  ON signing.saved_signers(user_id, email) 
  WHERE type = 'personal';

CREATE UNIQUE INDEX idx_saved_signers_unique_org 
  ON signing.saved_signers(organization_id, email) 
  WHERE type = 'organization';

-- 3. Índices adicionales para búsqueda
CREATE INDEX idx_saved_signers_user ON signing.saved_signers(user_id) WHERE type = 'personal';
CREATE INDEX idx_saved_signers_org ON signing.saved_signers(organization_id) WHERE type = 'organization';
CREATE INDEX idx_saved_signers_email ON signing.saved_signers(email);

-- 4. Habilitar RLS
ALTER TABLE signing.saved_signers ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS

-- Política de lectura: Ver propios o de su organización
CREATE POLICY "Users can view their own personal saved signers"
ON signing.saved_signers FOR SELECT
USING (
  (type = 'personal' AND user_id = auth.uid()) OR
  (type = 'organization' AND organization_id IN (
    SELECT organization_id FROM core.organization_users WHERE user_id = auth.uid() AND status = 'active'
  ))
);

-- Política de inserción: Solo para sí mismo o su organización
CREATE POLICY "Users can insert their own saved signers"
ON signing.saved_signers FOR INSERT
WITH CHECK (
  (type = 'personal' AND user_id = auth.uid()) OR
  (type = 'organization' AND organization_id IN (
    SELECT organization_id FROM core.organization_users WHERE user_id = auth.uid() AND status = 'active'
  ))
);

-- Política de actualización: Solo dueños o miembros de la organización
CREATE POLICY "Users can update their own saved signers"
ON signing.saved_signers FOR UPDATE
USING (
  (type = 'personal' AND user_id = auth.uid()) OR
  (type = 'organization' AND organization_id IN (
    SELECT organization_id FROM core.organization_users WHERE user_id = auth.uid() AND status = 'active'
  ))
);

-- Política de eliminación: Solo dueños o miembros de la organización
CREATE POLICY "Users can delete their own saved signers"
ON signing.saved_signers FOR DELETE
USING (
  (type = 'personal' AND user_id = auth.uid()) OR
  (type = 'organization' AND organization_id IN (
    SELECT organization_id FROM core.organization_users WHERE user_id = auth.uid() AND status = 'active'
  ))
);

-- 6. Otorgar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON signing.saved_signers TO authenticated;

-- 7. Trigger para updated_at
CREATE OR REPLACE FUNCTION signing.handle_saved_signers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_saved_signers_updated_at
  BEFORE UPDATE ON signing.saved_signers
  FOR EACH ROW
  EXECUTE FUNCTION signing.handle_saved_signers_updated_at();

-- 8. Función para incrementar uso
CREATE OR REPLACE FUNCTION signing.increment_saved_signer_usage(p_signer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE signing.saved_signers
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = p_signer_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION signing.increment_saved_signer_usage(UUID) TO authenticated;

-- 9. Crear vista pública para acceso desde el cliente
CREATE OR REPLACE VIEW public.saved_signers AS
SELECT * FROM signing.saved_signers;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_signers TO authenticated;

