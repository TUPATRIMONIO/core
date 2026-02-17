-- Datos confirmados por el firmante (para auditoria, mantener originales intactos)
ALTER TABLE signing.signers ADD COLUMN confirmed_full_name TEXT;
ALTER TABLE signing.signers ADD COLUMN confirmed_identifier_type TEXT;
ALTER TABLE signing.signers ADD COLUMN confirmed_identifier_value TEXT;
ALTER TABLE signing.signers ADD COLUMN identity_confirmed_at TIMESTAMPTZ;

-- Firma manuscrita (path en storage)
ALTER TABLE signing.signers ADD COLUMN handwritten_signature_path TEXT;

-- IP del cliente (ya existe signature_ip, pero agregar campo para IP confirmada)
ALTER TABLE signing.signers ADD COLUMN client_ip TEXT;
