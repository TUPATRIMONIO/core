-- Migration: Fix Chile Legal Review Prompt output_schema for Claude API
-- Description: Adds additionalProperties: false to all object types as required by Claude
-- Created: 2025-12-16

-- Update the Chile prompt with corrected output_schema
UPDATE public.ai_prompts 
SET output_schema = '{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "resultado_revision": {
      "type": "string",
      "enum": ["aprobado", "observado", "rechazado"],
      "description": "Resultado final de la revisión"
    },
    "tipo_documento": {
      "type": "string",
      "description": "Tipo de documento identificado (ej: Contrato de Arrendamiento, Poder, etc.)"
    },
    "titulo_documento": {
      "type": "string",
      "description": "Título exacto del documento"
    },
    "resumen": {
      "type": "string",
      "description": "Resumen del documento en máximo 50 palabras"
    },
    "puntos_importantes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Lista de los puntos más importantes del documento"
    },
    "cantidad_firmantes": {
      "type": "integer",
      "description": "Número de personas que deben firmar el documento"
    },
    "observaciones": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "tipo": {
            "type": "string",
            "enum": ["error", "advertencia", "sugerencia"],
            "description": "Tipo de observación"
          },
          "descripcion": {
            "type": "string",
            "description": "Descripción de la observación"
          },
          "fragmento": {
            "type": "string",
            "description": "Fragmento del documento relacionado (si aplica)"
          }
        },
        "required": ["tipo", "descripcion"]
      },
      "description": "Lista de observaciones encontradas"
    },
    "razones_rechazo": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Razones por las cuales el documento fue rechazado (solo si resultado es rechazado)"
    },
    "sugerencias_modificacion": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Sugerencias para corregir el documento (solo si resultado es observado)"
    },
    "servicio_notarial_sugerido": {
      "type": "string",
      "enum": ["ninguno", "protocolizacion", "firma_autorizada_notario", "copia_legalizada"],
      "description": "Servicio notarial sugerido según el tipo de documento"
    },
    "confianza": {
      "type": "number",
      "description": "Nivel de confianza del análisis (0 a 1)"
    }
  },
  "required": ["resultado_revision", "tipo_documento", "resumen", "puntos_importantes", "cantidad_firmantes", "confianza"]
}'::jsonb
WHERE feature_type = 'document_review' 
  AND country_code = 'CL'
  AND is_active = true;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Chile prompt output_schema fixed with additionalProperties: false';
END $$;
