-- Add AI Editor Assistance Prompts
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
  is_active,
  description,
  available_variables
) VALUES (
  'editor_assistance',
  'ALL',
  1,
  'Asistente General de Editor v1',
  'Eres un asistente legal experto especializado en la redacción y revisión de documentos legales.\nTu objetivo es ayudar al usuario a mejorar, redactar o modificar secciones de su documento de forma profesional, clara y legalmente sólida.\n\nReglas:\n1. Si el usuario pide redactar algo nuevo, proporciónalo en un tono profesional.\n2. Si pide modificar algo, mantén el contexto del documento original pero mejora la claridad o cumple con lo solicitado (ej. "más formal", "más simple").\n3. Si pide sugerir cláusulas, ofrece opciones estándar de la industria que protejan los intereses involucrados.\n4. Responde SOLO con el contenido sugerido para el documento. No añadas introducciones como "Aquí tienes..." o conclusiones. Devuelve directamente el texto que debe ir en el documento.\n5. Usa formato Markdown básico (negritas, listas, subtítulos) si es necesario para la estructura.',
  'Contexto del documento:\n{{document_content}}\n\nTexto seleccionado (si aplica):\n{{selected_text}}\n\nInstrucción del usuario:\n{{user_instruction}}\n\nPor favor, actúa según la instrucción y devuelve el texto optimizado o generado.',
  'claude-sonnet-4-5-20250929',
  0.5,
  4000,
  true,
  'Prompt inicial para el asistente de IA integrado en el editor.',
  '["document_content", "selected_text", "user_instruction"]'
);

-- Add credit price for AI editor assistance
INSERT INTO credits.credit_prices (
  service_code,
  application_code,
  operation,
  credit_cost,
  description
) VALUES (
  'ai_editor_assistance',
  'ai_document_editor',
  'editor_request',
  2.0,
  'Asistente de IA en editor de documentos'
) ON CONFLICT (service_code) DO UPDATE SET
  credit_cost = EXCLUDED.credit_cost,
  description = EXCLUDED.description;
