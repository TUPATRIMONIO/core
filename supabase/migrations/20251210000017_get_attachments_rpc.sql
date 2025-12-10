-- RPC: Get all attachments for a ticket
CREATE OR REPLACE FUNCTION public.get_ticket_attachments(
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
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'file_name', file_name,
      'file_path', file_path,
      'file_type', file_type,
      'file_size', file_size,
      'created_at', created_at,
      'uploaded_by', uploaded_by
    )
  )
  INTO v_result
  FROM crm.ticket_attachments
  WHERE ticket_id = p_ticket_id;

  -- Return empty array if null
  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_ticket_attachments TO authenticated;
