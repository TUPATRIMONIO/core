/**
 * Fix: Políticas de lectura para email_accounts
 * Permite a usuarios ver cuentas compartidas de su org y sus propias cuentas personales
 */

-- Eliminar política restrictiva anterior
DROP POLICY IF EXISTS "Users can view email accounts in their org" ON crm.email_accounts;

-- Nueva política más clara y permisiva para SELECT
CREATE POLICY "Users can view shared accounts in their org"
  ON crm.email_accounts FOR SELECT
  USING (
    -- Pueden ver cuentas de su organización
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND
    (
      -- Caso 1: Cuenta compartida (todos los de la org la ven)
      account_type = 'shared'
      OR
      -- Caso 2: Cuenta personal propia (solo el dueño la ve)
      (account_type = 'personal' AND owner_user_id = auth.uid())
    )
  );

COMMENT ON POLICY "Users can view shared accounts in their org" ON crm.email_accounts 
IS 'Permite ver cuentas compartidas de la org y cuentas personales propias';

