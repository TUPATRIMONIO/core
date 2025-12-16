-- Migration: Insert Chile Legal Document Review Prompt
-- Description: Complete prompt for Chilean legal document review according to Ley 19.799
-- Created: 2025-12-16

-- First, deactivate any existing Chile prompts for document_review
UPDATE public.ai_prompts 
SET is_active = false 
WHERE feature_type = 'document_review' 
  AND country_code = 'CL';

-- Insert the new Chile Legal Document Review Prompt
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
  description,
  country_context,
  available_variables
) VALUES (
  'document_review',
  'CL',
  1,
  'Revisión Legal Chile v1',
  -- System Prompt
  $system$Eres un asistente experto en revisión de documentos legales en español para Chile.
Tu tarea es revisar cuidadosamente el documento proporcionado y determinar si cumple con los criterios especificados y si es posible que pueda continuar al siguiente paso del flujo, que es la firma electrónica del documento.

IMPORTANTE: Siempre responde en español y en el formato JSON estructurado requerido.$system$,
  
  -- User Prompt Template
  $user$Revisa el siguiente documento PDF según estas instrucciones:

<Contexto-de-la-revisión>
El objetivo de la revisión es determinar si el documento puede proceder a firma electrónica y proporcionar:
1. Un resumen de máximo 50 palabras del documento.
2. Los puntos más importantes del documento.
3. La cantidad de firmantes requeridos.
</Contexto-de-la-revisión>

<Instrucciones-generales-de-revisión>
Realiza las siguientes tareas al revisar el documento:

1. **Identificación del tipo de documento**:
   - Verifica que NO esté dentro de los documentos no permitidos:
     - Pagaré
   - Si es un documento no permitido, el resultado debe ser "rechazado".

2. **Análisis del título del documento**:
   - Identifica el título exacto.
   - Evalúa coherencia con el contenido.

3. **Identificación de personas**:
   - **Requieren datos completos** (nombre, apellidos, número de identificación):
     - Partes principales del contrato (ej: arrendador/arrendatario, comprador/vendedor).
     - Representantes legales que firman el documento.
   - **NO requieren datos completos**:
     - Corredores de propiedades, contactos para notificaciones, habitantes adicionales del inmueble, personal de mantenimiento, personas en referencias históricas, propietarios anteriores, secretarios en actas, referencias generales.
   - Errores **NO críticos** (no son motivo de rechazo):
     - Errores tipográficos menores en nombres.
     - Variaciones menores en apellidos.
     - Discrepancias en orden de nombres.
     - Errores materiales menores en números de identificación.

4. **Direcciones de los comparecientes**:
   - Está permitida la falta de la región en las direcciones.

5. **Fecha de comparecencia**:
   - La fecha puede estar en distintos formatos (palabras o números).
   - No es obligatoria la fecha exacta de comparecencia.
   - Rechazar SOLO si hay fecha futura respecto a la fecha actual ({{current_date}}).
   - Se permiten errores materiales menores en fechas.

6. **Hojas en blanco**:
   - Verificar ausencia de hojas o secciones sin contenido.
   - {{has_blank_pages}}

7. **Firma electrónica**:
   - Menciones permitidas:
     - "Este documento ha sido firmado electrónicamente en conformidad con la Ley 19.799".
     - Referencias similares a firma electrónica legal.

8. **Cantidad de firmantes**:
   - Indica el número de personas que deben firmar el documento, según lo mencionado en el documento.

9. **Instrucciones especiales**:
   - Ignorar la primera página si contiene solo código QR y referencia a la Ley 19.799.
   - La mención "Escritura EMPRESA EN UN DIA otorgada por MINISTERIO DE ECONOMIA" está permitida.
   - En múltiples documentos, revisar solo el primero.
   - Se permiten referencias a documentos notariales históricos.
</Instrucciones-generales-de-revisión>

<Instrucciones-específicas-por-tipo>
a) **Contratos de arrendamiento**:
   - En la dirección: debe incluir la comuna.
   - Errores menores en numeración no son motivo de rechazo.

b) **Contratos de trabajo**:
   - Rechazar si el trabajador es extranjero.

c) **Junta extraordinaria o acuerdo de accionistas**:
   - Debe indicarse en el cuerpo del documento a dos testigos mayores de 18 años, distintos a los accionistas.
   - Observar documento indicando al usuario que debe seleccionar el servicio notarial de Protocolización.

d) **Salvoconducto de mudanza**:
   - Observar documento indicando al usuario que debe seleccionar el servicio notarial de Protocolización.

e) **Mutuos**:
   - Observar documento indicando al usuario que debe seleccionar el servicio notarial de Protocolización o Firma Autorizada por Notario.
</Instrucciones-específicas-por-tipo>

<Resultado-de-revisión>
Determina el resultado según la prioridad: Rechazado > Observado > Aprobado.

1. **Rechazado**:
   - Cualquier documento que esté en la lista de documentos no permitidos (ej: Pagaré).
   - Indicar que el documento debe ser realizado de forma presencial en una notaría.

2. **Observado**:
   - Cualquier error o discrepancia según las instrucciones anteriores.
   - El usuario puede continuar aceptando los riesgos.

3. **Aprobado**:
   - Si no hay motivos para Rechazado u Observado.
</Resultado-de-revisión>

<Manejo-de-incertidumbre>
Cuando exista información ambigua o incompleta, el resultado debe ser "observado", mencionando el fragmento que es ambiguo o incompleto.
</Manejo-de-incertidumbre>

Fecha actual: {{current_date}}
Zona horaria: America/Santiago$user$,

  'claude-sonnet-4-5-20250929',
  0.2,
  4000,
  
  -- Output Schema (JSON)
  '{
    "type": "object",
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
        "minimum": 0,
        "maximum": 1,
        "description": "Nivel de confianza del análisis (0 a 1)"
      }
    },
    "required": ["resultado_revision", "tipo_documento", "resumen", "puntos_importantes", "cantidad_firmantes", "confianza"]
  }'::jsonb,
  
  true, -- is_active
  'Prompt completo para revisión de documentos legales en Chile según Ley 19.799',
  
  -- Country Context
  '{
    "laws": ["Ley 19.799 sobre firma electrónica"],
    "timezone": "America/Santiago",
    "date_format": "DD/MM/YYYY",
    "forbidden_documents": ["Pagaré"],
    "notary_required_types": ["Junta extraordinaria", "Salvoconducto de mudanza", "Mutuo"]
  }'::jsonb,
  
  -- Available Variables
  '["current_date", "country_code", "document_id", "has_blank_pages"]'::jsonb
)
ON CONFLICT (feature_type, country_code, version) 
DO UPDATE SET
  name = EXCLUDED.name,
  system_prompt = EXCLUDED.system_prompt,
  user_prompt_template = EXCLUDED.user_prompt_template,
  output_schema = EXCLUDED.output_schema,
  is_active = EXCLUDED.is_active,
  description = EXCLUDED.description,
  country_context = EXCLUDED.country_context,
  available_variables = EXCLUDED.available_variables;

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Chile Legal Document Review Prompt inserted/updated';
END $$;
