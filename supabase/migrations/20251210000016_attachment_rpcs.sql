-- Migration: Create RPCs for managing ticket attachments safely
-- This avoids direct access to crm.ticket_attachments via the API

-- RPC: Delete attachment
CREATE OR REPLACE FUNCTION public.delete_ticket_attachment(
  p_attachment_id UUID,
  p_ticket_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, crm, extensions
AS $$
DECLARE
  v_file_path TEXT;
  v_result JSONB;
BEGIN
  -- Get the file path before deleting (to return it for storage cleanup)
  SELECT file_path INTO v_file_path
  FROM crm.ticket_attachments
  WHERE id = p_attachment_id AND ticket_id = p_ticket_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attachment not found');
  END IF;

  -- Delete the record
  DELETE FROM crm.ticket_attachments
  WHERE id = p_attachment_id;

  RETURN jsonb_build_object(
    'success', true,
    'file_path', v_file_path
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_ticket_attachment TO authenticated;


-- RPC: Get attachment details (for safe lookup)
CREATE OR REPLACE FUNCTION public.get_ticket_attachment(
  p_attachment_id UUID,
  p_ticket_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, crm, extensions
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'file_path', file_path,
    'ticket_id', ticket_id,
    'uploaded_by', uploaded_by
  )
  INTO v_result
  FROM crm.ticket_attachments
  WHERE id = p_attachment_id AND ticket_id = p_ticket_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ticket_attachment TO authenticated;
