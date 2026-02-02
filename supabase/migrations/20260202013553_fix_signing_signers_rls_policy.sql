-- =====================================================
-- Migration: Fix signing.signers RLS for internal updates
-- Description: Agrega política permisiva para permitir actualizaciones
--              desde funciones SECURITY DEFINER y triggers
-- Created: 2026-02-02
-- =====================================================

-- Agregar política permisiva para actualizaciones internas en signing.signers
-- Esto permite que las funciones con SECURITY DEFINER puedan actualizar firmantes
DROP POLICY IF EXISTS "Internal updates on signers" ON signing.signers;
CREATE POLICY "Internal updates on signers"
ON signing.signers FOR UPDATE
USING (true)
WITH CHECK (true);

-- También para INSERT (por si acaso)
DROP POLICY IF EXISTS "Internal inserts on signers" ON signing.signers;
CREATE POLICY "Internal inserts on signers"
ON signing.signers FOR INSERT
WITH CHECK (true);

-- Y para signer_history
DROP POLICY IF EXISTS "Allow all inserts on signer_history" ON signing.signer_history;
CREATE POLICY "Allow all inserts on signer_history"
ON signing.signer_history FOR INSERT
WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS permisivas agregadas a signing.signers';
END $$;
