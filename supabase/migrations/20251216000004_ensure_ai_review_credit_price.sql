-- Asegurar que exista el precio para revisión IA de documentos
-- El registro ya existe, solo actualizamos si es necesario
UPDATE credits.credit_prices
SET credit_cost = 10.0,
    description = 'Revisión completa de documento por IA'
WHERE service_code = 'ai_document_review_full';

-- Si no existía, insertamos
INSERT INTO credits.credit_prices (
  service_code,
  application_code,
  operation,
  credit_cost,
  description
) 
SELECT 
  'ai_document_review_full',
  'ai_document_review',
  'review_document',
  10.0,
  'Revisión completa de documento por IA'
WHERE NOT EXISTS (
  SELECT 1 FROM credits.credit_prices WHERE service_code = 'ai_document_review_full'
);

DO $$
BEGIN
  RAISE NOTICE '✅ Precio ai_document_review_full asegurado (10 créditos)';
END $$;



