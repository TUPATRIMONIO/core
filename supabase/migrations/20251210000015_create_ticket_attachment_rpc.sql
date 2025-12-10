-- Migration: Create RPC to safely insert ticket attachments
-- This allows inserting into crm.ticket_attachments without exposing the crm schema to the API

CREATE OR REPLACE FUNCTION public.create_ticket_attachment(
  p_ticket_id UUID,
  p_file_name TEXT,
  p_file_path TEXT,
  p_file_type TEXT,
  p_file_size BIGINT,
  p_uploaded_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator
SET search_path = public, crm, extensions -- Set search path safely
AS $$
DECLARE
  v_attachment_id UUID;
  v_result JSONB;
BEGIN
  -- Verify the ticket exists (optional extra check)
  PERFORM 1 FROM crm.tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  -- Insert the attachment
  INSERT INTO crm.ticket_attachments (
    ticket_id,
    file_name,
    file_path,
    file_type,
    file_size,
    uploaded_by
  )
  VALUES (
    p_ticket_id,
    p_file_name,
    p_file_path,
    p_file_type,
    p_file_size,
    p_uploaded_by
  )
  RETURNING id INTO v_attachment_id;

  -- Return the created record as JSON
  SELECT jsonb_build_object(
    'id', id,
    'file_name', file_name,
    'file_path', file_path,
    'file_type', file_type,
    'file_size', file_size
  )
  INTO v_result
  FROM crm.ticket_attachments
  WHERE id = v_attachment_id;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_ticket_attachment TO authenticated;
