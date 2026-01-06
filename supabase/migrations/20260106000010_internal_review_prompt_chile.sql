-- Migration: Insert Internal Chile Legal Document Review Prompt
-- Description: Prompt for internal AI review post-payment, adapted from the public version
-- Created: 2026-01-06

-- Primero, desactivar cualquier otro prompt activo con la misma combinación
-- para evitar violar el índice único unique_active_prompt
UPDATE public.ai_prompts 
SET is_active = false 
WHERE feature_type = 'internal_document_review' 
  AND country_code = 'CL'
  AND is_internal_review = true
  AND service_type IS NULL
  AND document_type IS NULL
  AND version != 1;  -- No desactivamos el que vamos a insertar/actualizar

-- Insertar o actualizar el prompt interno
INSERT INTO public.ai_prompts (
  feature_type,
  country_code,
  version,
  name,
  system_prompt,
  user_prompt_template,
  ai_model,
  temperature,
  max_tokens,
  output_schema,
  is_active,
  is_internal_review,
  description,
  country_context,
  available_variables
) VALUES (
  'internal_document_review',
  'CL',
  1,
  'Revisión Interna Chile v1',
  -- System Prompt
  $system$Eres un asistente experto en revisión de documentos legales en español para Chile, especializado en procesos de back-office.
Tu tarea es realizar una auditoría técnica del documento para asegurar que cumple con los requisitos legales mínimos para ser firmado electrónicamente y notariado si corresponde.

IMPORTANTE: Siempre responde en español y en el formato JSON estructurado requerido. Debes ser extremadamente preciso en la identificación de riesgos y discrepancias.$system$,
  
  -- User Prompt Template
  $user$Realiza una revisión técnica interna del siguiente documento PDF según estas instrucciones:

<Contexto-de-la-revisión>
El objetivo es validar internamente si el documento es apto para firma y notarización.
Debes comparar la información del documento con la metadata proporcionada ({{document_type}}, {{service_type}}).
</Contexto-de-la-revisión>

<Instrucciones-generales-de-revisión>
1. **Identificación del tipo de documento**:
   - Detecta qué tipo de documento es.
   - Compáralo con el tipo declarado por el usuario ({{document_type}}).
   - Verifica si está en la lista negra (Pagaré).

2. **Validación de Requisitos**:
   - Verifica si cumple con los requisitos mínimos del servicio ({{service_type}}).
   - Identifica firmantes y sus datos.

3. **Análisis de Riesgos**:
   - Identifica errores críticos (nombres erróneos, RUTs inválidos, fechas futuras).
   - Identifica advertencias (cláusulas ambiguas, falta de comunas).
</Instrucciones-generales-de-revisión>

Documento Metadata:
- Tipo Declarado: {{document_type}}
- Servicio: {{service_type}}
- País: {{country_code}}
- Fecha Actual: {{current_date}}

Por favor, analiza el PDF adjunto.$user$,

  'claude-sonnet-4-5-20250929',
  0.2,
  4000,
  
  -- Output Schema (Adaptado a InternalReviewResult y compatible con Claude Structured Outputs)
  '{
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "resultado_revision": {
        "type": "string",
        "enum": ["aprobado", "observado", "rechazado"],
        "description": "Resultado final de la revisión interna"
      },
      "tipo_documento_detectado": {
        "type": "string",
        "description": "Tipo de documento identificado por la IA"
      },
      "tipo_documento_coincide": {
        "type": "boolean",
        "description": "Si el tipo detectado coincide con el declarado por el usuario"
      },
      "resumen": {
        "type": "string",
        "description": "Resumen técnico corto (max 50 palabras)"
      },
      "puntos_importantes": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Lista de puntos clave encontrados"
      },
      "cantidad_firmantes": {
        "type": "integer",
        "description": "Número de firmantes detectados en el texto"
      },
      "observaciones": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "tipo": {
              "type": "string",
              "enum": ["error", "advertencia", "sugerencia"]
            },
            "descripcion": {
              "type": "string"
            },
            "fragmento": {
              "type": "string"
            }
          },
          "required": ["tipo", "descripcion"]
        }
      },
      "razones_rechazo": {
        "type": "array",
        "items": { "type": "string" }
      },
      "requisitos_servicio_cumplidos": {
        "type": "boolean",
        "description": "Si cumple con los requisitos para el service_type seleccionado"
      },
      "requisitos_faltantes": {
        "type": "array",
        "items": { "type": "string" }
      },
      "confianza": {
        "type": "number",
        "description": "Nivel de confianza del análisis (0 a 1)"
      }
    },
    "required": ["resultado_revision", "tipo_documento_detectado", "tipo_documento_coincide", "resumen", "puntos_importantes", "cantidad_firmantes", "requisitos_servicio_cumplidos", "confianza"]
  }'::jsonb,
  
  true, -- is_active
  true, -- is_internal_review
  'Prompt interno para revisión automática post-pago en Chile',
  
  -- Country Context
  '{
    "laws": ["Ley 19.799 sobre firma electrónica"],
    "forbidden_documents": ["Pagaré"]
  }'::jsonb,
  
  -- Available Variables
  '["current_date", "country_code", "document_type", "service_type"]'::jsonb
)
ON CONFLICT (feature_type, country_code, version) 
DO UPDATE SET
  name = EXCLUDED.name,
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  ai_model = EXCLUDED.ai_model,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  output_schema = EXCLUDED.output_schema,
  is_active = EXCLUDED.is_active,
  is_internal_review = EXCLUDED.is_internal_review,
  description = EXCLUDED.description,
  country_context = EXCLUDED.country_context,
  available_variables = EXCLUDED.available_variables;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Internal Chile Legal Document Review Prompt inserted/updated';
END $$;
