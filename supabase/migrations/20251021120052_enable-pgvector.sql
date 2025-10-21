-- Migration: Enable pgvector extension for AI features
-- Description: Enables vector similarity search for AI embeddings used in customer service chatbot and document analysis
-- Created: 2025-10-21

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector 
  WITH SCHEMA extensions;

-- Grant usage on extensions schema to all roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Add comment explaining the extension purpose
COMMENT ON EXTENSION vector IS 'Vector similarity search for AI embeddings - used for chatbot knowledge base and document analysis';

-- Verify extension is installed correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    RAISE EXCEPTION 'pgvector extension was not installed correctly';
  END IF;
END
$$;
