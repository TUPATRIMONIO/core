-- Create table for ticket attachments
CREATE TABLE IF NOT EXISTS crm.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES crm.tickets(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Storage path
    file_type TEXT, -- MIME type
    file_size BIGINT,
    uploaded_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE crm.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of accessible tickets" ON crm.ticket_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM crm.tickets t
            WHERE t.id = ticket_id
            -- Add logic here for organization access if needed, e.g.
            -- AND t.organization_id = (SELECT organization_id FROM core.users WHERE id = auth.uid())
            -- For now, simple link check
        )
    );

CREATE POLICY "Users can upload attachments" ON crm.ticket_attachments
    FOR INSERT
    WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their attachments" ON crm.ticket_attachments
    FOR DELETE
    USING (auth.uid() = uploaded_by);
