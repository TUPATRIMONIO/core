-- Migration: Fix Support Tickets Foreign Key Constraint
-- Description: Changes support_tickets.user_id constraint to allow ON DELETE SET NULL
-- Created: 2026-01-23

-- 1. Eliminar la constraint existente
ALTER TABLE communications.support_tickets 
DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey;

-- 2. Recrear la constraint con ON DELETE SET NULL
ALTER TABLE communications.support_tickets 
ADD CONSTRAINT support_tickets_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES core.users(id) 
ON DELETE SET NULL;

-- 3. Lo mismo para ticket_messages (nombre correcto de la tabla)
ALTER TABLE communications.ticket_messages 
DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;

ALTER TABLE communications.ticket_messages 
ADD CONSTRAINT ticket_messages_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES core.users(id) 
ON DELETE SET NULL;
