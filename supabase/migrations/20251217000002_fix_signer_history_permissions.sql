-- Grant permissions for signer_history table
GRANT INSERT ON signing.signer_history TO service_role;
GRANT INSERT ON signing.signer_history TO authenticated;
GRANT INSERT ON signing.signer_history TO anon; -- Since the signing page is public

-- Ensure sequence permissions if ID is serial
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA signing TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA signing TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA signing TO anon;

-- Add policy for inserting history
CREATE POLICY "Allow public insert for signer history" ON signing.signer_history
    FOR INSERT
    WITH CHECK (true); -- Or restrict based on relation to signer token if possible
