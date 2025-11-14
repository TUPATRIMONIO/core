/**
 * Fix: Permisos de email_accounts
 * Permite a usuarios con acceso al CRM crear cuentas (propias o compartidas si son owners)
 */

-- Eliminar política restrictiva
DROP POLICY IF EXISTS "Owners can manage email accounts" ON crm.email_accounts;

-- Política para insertar cuentas
CREATE POLICY "Users with CRM access can create email accounts"
  ON crm.email_accounts FOR INSERT
  WITH CHECK (
    -- Verificar que el usuario pertenece a la org
    organization_id IN (
      SELECT organization_id FROM core.organization_users
      WHERE user_id = auth.uid() AND status = 'active'
    )
    AND
    (
      -- Caso 1: Es cuenta personal y el owner es el usuario actual
      (account_type = 'personal' AND owner_user_id = auth.uid())
      OR
      -- Caso 2: Es cuenta compartida y el usuario es owner/admin de la org
      (
        account_type = 'shared'
        AND organization_id IN (
          SELECT ou.organization_id FROM core.organization_users ou
          JOIN core.roles r ON r.id = ou.role_id
          WHERE ou.user_id = auth.uid() 
          AND ou.status = 'active'
          AND r.name IN ('owner', 'admin')
        )
      )
    )
  );

-- Política para actualizar/eliminar cuentas
CREATE POLICY "Users can manage their own accounts or admins can manage org accounts"
  ON crm.email_accounts FOR UPDATE
  USING (
    -- Caso 1: Es mi cuenta personal
    (account_type = 'personal' AND owner_user_id = auth.uid())
    OR
    -- Caso 2: Soy owner/admin de la org
    (
      organization_id IN (
        SELECT ou.organization_id FROM core.organization_users ou
        JOIN core.roles r ON r.id = ou.role_id
        WHERE ou.user_id = auth.uid() 
        AND ou.status = 'active'
        AND r.name IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Users can delete their own accounts or admins can delete org accounts"
  ON crm.email_accounts FOR DELETE
  USING (
    -- Caso 1: Es mi cuenta personal
    (account_type = 'personal' AND owner_user_id = auth.uid())
    OR
    -- Caso 2: Soy owner/admin de la org
    (
      organization_id IN (
        SELECT ou.organization_id FROM core.organization_users ou
        JOIN core.roles r ON r.id = ou.role_id
        WHERE ou.user_id = auth.uid() 
        AND ou.status = 'active'
        AND r.name IN ('owner', 'admin')
      )
    )
  );

COMMENT ON POLICY "Users with CRM access can create email accounts" ON crm.email_accounts 
IS 'Permite crear cuentas personales propias o compartidas si eres owner/admin';

