-- Campos para validación ClaveÚnica con Identyz en signing.signers
-- Usado cuando el producto es fes_claveunica_cl (FAN con FES + ClaveÚnica)

ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_doc_id TEXT;
ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_request_id TEXT;
ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_status TEXT DEFAULT 'none';
ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_signer_url TEXT;
ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_verified_at TIMESTAMPTZ;
ALTER TABLE signing.signers ADD COLUMN IF NOT EXISTS claveunica_user_info JSONB;

-- Constraint para claveunica_status
ALTER TABLE signing.signers DROP CONSTRAINT IF EXISTS signing_signers_claveunica_status_check;
ALTER TABLE signing.signers ADD CONSTRAINT signing_signers_claveunica_status_check
  CHECK (claveunica_status IS NULL OR claveunica_status IN ('none', 'pending', 'verified', 'failed'));

-- Índice para búsqueda rápida desde el webhook
CREATE INDEX IF NOT EXISTS idx_signers_claveunica_doc_id
  ON signing.signers(claveunica_doc_id)
  WHERE claveunica_doc_id IS NOT NULL;
