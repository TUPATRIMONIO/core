-- 1. Agregar columnas a la tabla física en el esquema signing
ALTER TABLE signing.notary_offices
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at timestamptz,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 2. Agregar constraint de valores válidos
ALTER TABLE signing.notary_offices
ADD CONSTRAINT chk_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 3. Recrear la vista para incluir las nuevas columnas
CREATE OR REPLACE VIEW public.signing_notary_offices AS
SELECT 
    id,
    organization_id,
    name,
    country_code,
    city,
    address,
    email,
    phone,
    is_active,
    accepts_new_documents,
    created_at,
    updated_at,
    approval_status,
    approved_at,
    approved_by,
    rejection_reason
FROM signing.notary_offices;
