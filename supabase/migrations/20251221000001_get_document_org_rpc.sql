-- =====================================================
-- Migration: RPC to get document organization ID
-- Description: Helper function to get organization_id for AI editor
-- Created: 2025-12-21
-- =====================================================

-- Function to get organization_id from a document
CREATE OR REPLACE FUNCTION public.get_document_organization_id(
  p_document_id UUID
)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM documents.documents
  WHERE id = p_document_id;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_document_organization_id TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_document_organization_id TO service_role;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Función get_document_organization_id creada exitosamente';
END $$;
