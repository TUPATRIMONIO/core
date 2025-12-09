-- =====================================================
-- Migration: Create user email signatures system
-- Description: Sistema de firmas personales de email por usuario
-- Created: 2025-12-09
-- =====================================================

SET search_path TO communications, core, public, extensions;

-- Verificar que el schema communications existe
CREATE SCHEMA IF NOT EXISTS communications;

-- =====================================================
-- TABLA: user_email_signatures
-- =====================================================

CREATE TABLE IF NOT EXISTS communications.user_email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relaciones
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Contenido de la firma
  signature_html TEXT NOT NULL DEFAULT '',
  signature_text TEXT NOT NULL DEFAULT '',
  
  -- Configuración
  is_default BOOLEAN DEFAULT true, -- Firma predeterminada del usuario en esta organización
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, organization_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_user_signatures_user ON communications.user_email_signatures(user_id);
CREATE INDEX idx_user_signatures_org ON communications.user_email_signatures(organization_id);
CREATE INDEX idx_user_signatures_default ON communications.user_email_signatures(user_id, organization_id, is_default) WHERE is_default = true;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION communications.update_user_signature_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_signatures_updated_at
  BEFORE UPDATE ON communications.user_email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION communications.update_user_signature_updated_at();

-- Trigger para asegurar que solo haya una firma default por usuario/org
CREATE OR REPLACE FUNCTION communications.ensure_single_default_signature()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se está marcando como default, desmarcar las demás
  IF NEW.is_default = true THEN
    UPDATE communications.user_email_signatures
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_signature
  BEFORE INSERT OR UPDATE ON communications.user_email_signatures
  FOR EACH ROW
  EXECUTE FUNCTION communications.ensure_single_default_signature();

-- =====================================================
-- VISTA PÚBLICA
-- =====================================================

CREATE OR REPLACE VIEW public.user_email_signatures AS
SELECT 
  s.id,
  s.user_id,
  s.organization_id,
  s.signature_html,
  s.signature_text,
  s.is_default,
  s.created_at,
  s.updated_at,
  au.email as user_email,
  u.first_name,
  u.last_name,
  o.name as organization_name
FROM communications.user_email_signatures s
JOIN core.users u ON u.id = s.user_id
JOIN auth.users au ON au.id = s.user_id
JOIN core.organizations o ON o.id = s.organization_id;

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función para obtener la firma del usuario (o crear una por defecto si no existe)
CREATE OR REPLACE FUNCTION public.get_user_email_signature(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  signature_html TEXT,
  signature_text TEXT,
  is_default BOOLEAN
) AS $$
BEGIN
  -- Intentar obtener firma existente
  RETURN QUERY
  SELECT 
    s.id,
    s.signature_html,
    s.signature_text,
    s.is_default
  FROM communications.user_email_signatures s
  WHERE s.user_id = p_user_id
    AND s.organization_id = p_organization_id
  ORDER BY s.is_default DESC, s.created_at DESC
  LIMIT 1;
  
  -- Si no hay firma, retornar valores por defecto
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::UUID as id,
      ''::TEXT as signature_html,
      ''::TEXT as signature_text,
      true::BOOLEAN as is_default;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para guardar/actualizar firma del usuario
CREATE OR REPLACE FUNCTION public.upsert_user_email_signature(
  p_user_id UUID,
  p_organization_id UUID,
  p_signature_html TEXT,
  p_signature_text TEXT,
  p_is_default BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_signature_id UUID;
BEGIN
  -- Insertar o actualizar
  INSERT INTO communications.user_email_signatures (
    user_id,
    organization_id,
    signature_html,
    signature_text,
    is_default
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_signature_html,
    p_signature_text,
    p_is_default
  )
  ON CONFLICT (user_id, organization_id)
  DO UPDATE SET
    signature_html = EXCLUDED.signature_html,
    signature_text = EXCLUDED.signature_text,
    is_default = EXCLUDED.is_default,
    updated_at = NOW()
  RETURNING id INTO v_signature_id;
  
  RETURN v_signature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PERMISOS
-- =====================================================

-- Grants para la tabla
GRANT SELECT, INSERT, UPDATE ON communications.user_email_signatures TO authenticated;
GRANT SELECT ON public.user_email_signatures TO authenticated;

-- Grants para funciones RPC
GRANT EXECUTE ON FUNCTION public.get_user_email_signature(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_email_signature(UUID, UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE communications.user_email_signatures ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propias firmas
CREATE POLICY "Users can view their own signatures"
  ON communications.user_email_signatures
  FOR SELECT
  USING (user_id = auth.uid());

-- Los usuarios pueden insertar sus propias firmas
CREATE POLICY "Users can insert their own signatures"
  ON communications.user_email_signatures
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Los usuarios pueden actualizar sus propias firmas
CREATE POLICY "Users can update their own signatures"
  ON communications.user_email_signatures
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Platform admins pueden ver todas las firmas
CREATE POLICY "Platform admins can view all signatures"
  ON communications.user_email_signatures
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM _bypass.platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE communications.user_email_signatures IS 'Firmas personales de email por usuario y organización';
COMMENT ON COLUMN communications.user_email_signatures.signature_html IS 'Firma en formato HTML';
COMMENT ON COLUMN communications.user_email_signatures.signature_text IS 'Firma en texto plano (para emails sin HTML)';
COMMENT ON COLUMN communications.user_email_signatures.is_default IS 'Indica si es la firma predeterminada del usuario en esta organización';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Tabla communications.user_email_signatures creada exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Funciones creadas:';
  RAISE NOTICE '  ✅ get_user_email_signature(user_id, org_id)';
  RAISE NOTICE '  ✅ upsert_user_email_signature(user_id, org_id, html, text, is_default)';
  RAISE NOTICE '';
  RAISE NOTICE 'Vista pública:';
  RAISE NOTICE '  ✅ public.user_email_signatures';
END $$;

