-- Add 'observed' to the enum if it doesn't exist
-- This is split into its own migration to avoid "unsafe use of new value" error in transactions
ALTER TYPE signing.review_status ADD VALUE IF NOT EXISTS 'observed';
