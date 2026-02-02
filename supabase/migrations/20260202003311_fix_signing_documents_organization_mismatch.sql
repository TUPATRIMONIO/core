-- Migration: Fix signing documents with mismatched organization_id
-- Description: Corrects signing documents whose organization doesn't match their associated order's organization
-- This bug occurred when the frontend used localStorage org while backend used DB org, causing desync

-- Log affected documents before fixing (for audit trail)
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM signing_documents sd
  INNER JOIN orders o ON sd.order_id = o.id
  WHERE sd.organization_id != o.organization_id
    AND sd.order_id IS NOT NULL;
  
  RAISE NOTICE 'Found % signing documents with mismatched organization_id', affected_count;
END $$;

-- Update signing documents to match their order's organization
-- We assume the order's organization is the source of truth since that's where payment was made
UPDATE signing_documents sd
SET 
  organization_id = o.organization_id,
  updated_at = NOW()
FROM orders o
WHERE sd.order_id = o.id
  AND sd.organization_id != o.organization_id
  AND sd.order_id IS NOT NULL;

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE 'Fixed % signing documents to match their order organization', fixed_count;
END $$;

-- Verify no mismatches remain
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM signing_documents sd
  INNER JOIN orders o ON sd.order_id = o.id
  WHERE sd.organization_id != o.organization_id
    AND sd.order_id IS NOT NULL;
  
  IF remaining_count > 0 THEN
    RAISE WARNING 'Still found % documents with mismatched organizations after fix', remaining_count;
  ELSE
    RAISE NOTICE 'All signing documents now have matching organization_id with their orders';
  END IF;
END $$;
