-- Asegurar que exista el precio para revision IA
INSERT INTO credits.credit_prices (
  service_code,
  application_code, 
  operation,
  credit_cost,
  description
) VALUES (
  'ai_document_review_full',
  'ai_document_review',
  'full_review',
  10.0,
  'Analisis completo de riesgos usando Claude Sonnet 4'
) ON CONFLICT (service_code) DO UPDATE SET
  operation = EXCLUDED.operation,
  description = EXCLUDED.description,
  credit_cost = EXCLUDED.credit_cost;


