-- =====================================================
-- Migration: Seed CDS Provider and add refund rules
-- Description: Initial data for CDS provider and centralized refund rules
-- Created: 2025-12-11
-- =====================================================

SET search_path TO signing, billing, core, public, extensions;

-- =====================================================
-- SEED: CDS Provider (Certificadora del Sur)
-- =====================================================

INSERT INTO signing.providers (
  name,
  slug,
  description,
  provider_type,
  base_url,
  test_url,
  endpoints,
  error_codes,
  is_active,
  is_default,
  supported_countries
) VALUES (
  'Certificadora del Sur',
  'cds',
  'Proveedor de Firma Electrónica Avanzada (FEA) en Chile',
  'both', -- Firma e identidad
  'https://www.certificadoradelsur.cl/workflow/rest-services/public',
  'https://test2.certificadoradelsur.cl/workflow/rest-services/public',
  jsonb_build_object(
    'consultaVigenciaFEA', '/firmaIntegracionFEA/consultaVigenciaFEA',
    'enrolarFirmanteFEA', '/firmaIntegracionFEA/enrolarFirmanteFEA',
    'solicitarSegundoFactor', '/firmaIntegracionFEA/solicitarSegundoFactor',
    'firmaMultipleFeaApi', '/firmaIntegracionFEA/firmaMultipleFeaApi',
    'obtenerDocumentoPorCodigo', '/firmaIntegracion/obtenerDocumentoPorCodigo',
    'desbloqueoCertificado', '/firmaIntegracionFEA/desbloqueoCertificado',
    'desbloqueoSegundoFactor', '/firmaIntegracionFEA/desbloqueoSegundoFactor',
    'obtenerURL', '/firmaIntegracion/obtenerURL',
    'obtenerDatosPorRut', '/firmaIntegracion/obtenerDatosPorRut',
    'flujoSimpleFEA', '/firmaIntegracionFEA/flujoSimpleFEA'
  ),
  jsonb_build_object(
    '0', 'EXITO',
    '100', 'CAMPO_VACIO',
    '101', 'CONTIENE_CARACTER_INVALIDO',
    '102', 'RUT_INVALIDO',
    '103', 'NACIONALIDAD_VACIO',
    '104', 'CORREO_INVALIDO',
    '105', 'DOCUMENTO_NO_VALIDO',
    '106', 'ERROR_INTERNO',
    '107', 'FIRMANTE_NO_REGISTRADO',
    '108', 'USUARIO_O_CLAVE_INVALIDO',
    '109', 'USUARIO_NO_HABILITADO',
    '110', 'ERROR_EMPRESA_NO_HABILITADA',
    '111', 'TIPO_DE_FLUJO_NO_VALIDO',
    '112', 'ERROR_CON_ENROLMENT',
    '113', 'CODIGO_TRANSACCION_NO_VALIDO',
    '114', 'ERROR_CON_FIRMADOR',
    '118', 'CODIFICACION_DOCUMENTO',
    '119', 'DOCUMENTO_CORRUPTO',
    '120', 'URL_NOTIFICACION_INVALIDA',
    '121', 'FIRMANTE_SIN_FEA_VIGENTE',
    '122', 'MAXIMO_INTENTO_CLAVE_FEA',
    '123', 'CERTIFICADO_BLOQUEADO',
    '124', 'CLAVE_NO_COINCIDEN',
    '125', 'NOTIFICACION_ENROLADO',
    '126', 'ERROR_SERVICIO_SEGUNDO_FACTOR',
    '127', 'CODIGO_SEGUNDO_FACTOR',
    '128', 'PESO_MAXIMO_ARCHIVO',
    '129', 'ALMACENAMIENTO_LLENO',
    '130', 'DOCUMENTO_PROTEGIDO',
    '132', 'CANTIDAD_PAGINA_NO_COINCIDEN',
    '133', 'ERROR_AL_FIRMAR',
    '134', 'SEGUNDO_FACTOR_BLOQUEADO',
    '201', 'IP_NO_PERMITIDA',
    '202', 'REQUEST_INCOMPLETO',
    '203', 'USUARIO_CLAVE_NO_VALIDO',
    '204', 'RUT_NO_VALIDO',
    '205', 'CORREO_NO_VALIDO',
    '206', 'EMPRESA_NO_VALIDA',
    '209', 'ERROR_VALIDAR_VIGENCIA_CHECKIDENTITYCARD',
    '210', 'ERROR_OBTENER_DATOS_PERSONALINFORMATION',
    '211', 'ERROR_GENERAR_VALIDACION_SOLICITUD',
    '212', 'ERROR_GENERAR_CERTIFICADO',
    '213', 'NO_SE_ENCONTRO_TRANSACCION_POR_CODIGO',
    '217', 'ERROR_AL_VERIFICAR_FEA_VIGENTE',
    '222', 'SOLICITANTE_SIN_FEA_VIGENTE',
    '223', 'SEGUNDO_FACTOR_NO_BLOQUEADO'
  ),
  true,
  true, -- Es el proveedor por defecto
  ARRAY['CL']
) ON CONFLICT (slug) DO UPDATE SET
  endpoints = EXCLUDED.endpoints,
  error_codes = EXCLUDED.error_codes,
  updated_at = NOW();

-- =====================================================
-- CENTRALIZED REFUND RULES (in billing schema)
-- =====================================================

-- Crear tabla de reglas de reembolso si no existe
CREATE TABLE IF NOT EXISTS billing.refund_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación de la regla
  name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z][a-z0-9_]*[a-z0-9]$'),
  description TEXT,
  
  -- Aplicabilidad
  service_type TEXT NOT NULL, -- 'electronic_signature', 'notary_service', 'credits', 'subscription', etc.
  applies_to_stages TEXT[] NOT NULL DEFAULT '{}', -- Etapas donde aplica (ej: ['draft', 'pending_signature'])
  
  -- Condiciones
  min_time_elapsed_hours INTEGER, -- Tiempo mínimo desde la compra (NULL = sin mínimo)
  max_time_elapsed_hours INTEGER, -- Tiempo máximo desde la compra (NULL = sin máximo)
  
  -- Tipo de reembolso
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial', 'credit', 'none')),
  refund_percentage DECIMAL(5,2) CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  
  -- Aplicable a ciertos tipos de organización
  applies_to_org_types TEXT[] DEFAULT NULL, -- NULL = todos, ej: ['business', 'enterprise']
  
  -- Prioridad (para cuando múltiples reglas aplican)
  priority INTEGER NOT NULL DEFAULT 0,
  
  -- Estado
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_refund_rules_service ON billing.refund_rules(service_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_refund_rules_priority ON billing.refund_rules(priority DESC);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_refund_rules_updated_at ON billing.refund_rules;
CREATE TRIGGER update_refund_rules_updated_at
  BEFORE UPDATE ON billing.refund_rules
  FOR EACH ROW
  EXECUTE FUNCTION billing.update_orders_updated_at();

-- =====================================================
-- SEED: Default Refund Rules
-- =====================================================

-- Firma electrónica - Reembolso total si está en borrador
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Firma Electrónica - Borrador',
  'esign_draft_full_refund',
  'Reembolso total para documentos que aún están en borrador',
  'electronic_signature',
  ARRAY['draft'],
  'full',
  100,
  10
) ON CONFLICT (slug) DO NOTHING;

-- Firma electrónica - Reembolso parcial si está en revisión
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Firma Electrónica - En Revisión',
  'esign_review_partial_refund',
  'Reembolso parcial (80%) para documentos en proceso de revisión',
  'electronic_signature',
  ARRAY['pending_review', 'pending_ai_review'],
  'partial',
  80,
  9
) ON CONFLICT (slug) DO NOTHING;

-- Firma electrónica - Solo créditos si está pendiente de firma
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Firma Electrónica - Pendiente Firma',
  'esign_pending_sign_credit',
  'Solo créditos (50%) para documentos pendientes de firma',
  'electronic_signature',
  ARRAY['pending_signature', 'partially_signed'],
  'credit',
  50,
  8
) ON CONFLICT (slug) DO NOTHING;

-- Firma electrónica - Sin reembolso si ya está firmado
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Firma Electrónica - Ya Firmado',
  'esign_signed_no_refund',
  'Sin reembolso para documentos completamente firmados',
  'electronic_signature',
  ARRAY['signed', 'notarized', 'completed'],
  'none',
  0,
  7
) ON CONFLICT (slug) DO NOTHING;

-- Servicio notarial - Reembolso total antes de envío
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Notaría - Antes de Envío',
  'notary_before_sent_full_refund',
  'Reembolso total antes de enviar a notaría',
  'notary_service',
  ARRAY['draft', 'pending_signature', 'signed'],
  'full',
  100,
  10
) ON CONFLICT (slug) DO NOTHING;

-- Servicio notarial - Parcial si ya fue enviado
INSERT INTO billing.refund_rules (name, slug, description, service_type, applies_to_stages, refund_type, refund_percentage, priority)
VALUES (
  'Notaría - Después de Envío',
  'notary_after_sent_partial_refund',
  'Reembolso parcial (50%) si ya fue enviado a notaría',
  'notary_service',
  ARRAY['pending_notary', 'notary_observed'],
  'partial',
  50,
  9
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- FUNCTION: Get applicable refund rule
-- =====================================================

CREATE OR REPLACE FUNCTION billing.get_applicable_refund_rule(
  p_service_type TEXT,
  p_current_stage TEXT,
  p_org_type TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
BEGIN
  SELECT * INTO v_rule
  FROM billing.refund_rules
  WHERE service_type = p_service_type
    AND is_active = true
    AND (p_current_stage = ANY(applies_to_stages) OR applies_to_stages = '{}')
    AND (applies_to_org_types IS NULL OR p_org_type = ANY(applies_to_org_types))
  ORDER BY priority DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'refund_type', 'none',
      'refund_percentage', 0
    );
  END IF;
  
  RETURN jsonb_build_object(
    'found', true,
    'rule_id', v_rule.id,
    'rule_name', v_rule.name,
    'refund_type', v_rule.refund_type,
    'refund_percentage', v_rule.refund_percentage,
    'description', v_rule.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION billing.get_applicable_refund_rule(TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- GRANTS for refund_rules
-- =====================================================

GRANT SELECT ON billing.refund_rules TO authenticated;
GRANT ALL ON billing.refund_rules TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE billing.refund_rules IS 'Reglas centralizadas de reembolso para todos los servicios';
COMMENT ON COLUMN billing.refund_rules.applies_to_stages IS 'Etapas del proceso donde aplica esta regla';
COMMENT ON COLUMN billing.refund_rules.refund_type IS 'Tipo: full (100%), partial (% definido), credit (créditos), none (sin reembolso)';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Proveedor CDS y reglas de reembolso configuradas';
  RAISE NOTICE '';
  RAISE NOTICE 'Proveedor creado:';
  RAISE NOTICE '  - CDS (Certificadora del Sur) con todos los endpoints';
  RAISE NOTICE '';
  RAISE NOTICE 'Reglas de reembolso creadas:';
  RAISE NOTICE '  - esign_draft_full_refund (100%%)';
  RAISE NOTICE '  - esign_review_partial_refund (80%%)';
  RAISE NOTICE '  - esign_pending_sign_credit (50%% créditos)';
  RAISE NOTICE '  - esign_signed_no_refund (0%%)';
  RAISE NOTICE '  - notary_before_sent_full_refund (100%%)';
  RAISE NOTICE '  - notary_after_sent_partial_refund (50%%)';
END $$;
