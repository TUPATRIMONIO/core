/**
 * Función RPC para obtener threads filtrados por cuenta de email
 * Soluciona el problema de filtrar threads por account_id de manera eficiente
 */

CREATE OR REPLACE FUNCTION crm.get_threads_by_account(
  org_id UUID,
  account_uuid UUID,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  gmail_thread_id TEXT,
  contact_id UUID,
  company_id UUID,
  deal_id UUID,
  subject TEXT,
  snippet TEXT,
  participants TEXT[],
  status TEXT,
  is_read BOOLEAN,
  has_attachments BOOLEAN,
  email_count INTEGER,
  last_email_at TIMESTAMPTZ,
  last_email_from TEXT,
  labels TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (et.id)
    et.id,
    et.organization_id,
    et.gmail_thread_id,
    et.contact_id,
    et.company_id,
    et.deal_id,
    et.subject,
    et.snippet,
    et.participants,
    et.status,
    et.is_read,
    et.has_attachments,
    et.email_count,
    et.last_email_at,
    et.last_email_from,
    et.labels,
    et.created_at,
    et.updated_at
  FROM crm.email_threads et
  WHERE et.organization_id = org_id
  AND EXISTS (
    SELECT 1 FROM crm.emails e
    WHERE e.thread_id = et.gmail_thread_id
    AND e.organization_id = org_id
    AND (e.sent_from_account_id = account_uuid OR e.received_in_account_id = account_uuid)
  )
  ORDER BY et.id, et.last_email_at DESC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crm.get_threads_by_account IS 'Obtiene threads filtrados por cuenta de email con paginación';

