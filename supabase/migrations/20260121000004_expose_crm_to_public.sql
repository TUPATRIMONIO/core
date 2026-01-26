-- =====================================================
-- Migration: Expose CRM tables to public schema
-- Description: Crea vistas públicas para acceso via PostgREST
-- Created: 2026-01-21
-- =====================================================

-- Vista para tickets
CREATE OR REPLACE VIEW public.crm_tickets AS
SELECT * FROM crm.tickets;

-- Vista para mensajes de tickets
CREATE OR REPLACE VIEW public.crm_ticket_messages AS
SELECT * FROM crm.ticket_messages;

-- Vista para emails
CREATE OR REPLACE VIEW public.crm_emails AS
SELECT * FROM crm.emails;

-- Vista para actividades
CREATE OR REPLACE VIEW public.crm_activities AS
SELECT * FROM crm.activities;

-- Vista para contactos
CREATE OR REPLACE VIEW public.crm_contacts AS
SELECT * FROM crm.contacts;

-- Vista para asociación ticket-users
CREATE OR REPLACE VIEW public.crm_ticket_users AS
SELECT * FROM crm.ticket_users;

-- Vista para asociación ticket-contacts
CREATE OR REPLACE VIEW public.crm_ticket_contacts AS
SELECT * FROM crm.ticket_contacts;

-- Permisos para authenticated users
GRANT SELECT, INSERT, UPDATE ON public.crm_tickets TO authenticated;
GRANT SELECT, INSERT ON public.crm_ticket_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ticket_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_ticket_contacts TO authenticated;

-- Permisos para service_role (bypass RLS)
GRANT ALL ON public.crm_tickets TO service_role;
GRANT ALL ON public.crm_ticket_messages TO service_role;
GRANT ALL ON public.crm_emails TO service_role;
GRANT ALL ON public.crm_activities TO service_role;
GRANT ALL ON public.crm_contacts TO service_role;
GRANT ALL ON public.crm_ticket_users TO service_role;
GRANT ALL ON public.crm_ticket_contacts TO service_role;

-- Habilitar RLS en las vistas
ALTER VIEW public.crm_tickets SET (security_invoker = true);
ALTER VIEW public.crm_ticket_messages SET (security_invoker = true);
ALTER VIEW public.crm_emails SET (security_invoker = true);
ALTER VIEW public.crm_activities SET (security_invoker = true);
ALTER VIEW public.crm_contacts SET (security_invoker = true);
ALTER VIEW public.crm_ticket_users SET (security_invoker = true);
ALTER VIEW public.crm_ticket_contacts SET (security_invoker = true);

-- Nota: Las políticas RLS de las tablas subyacentes (crm.tickets, crm.ticket_messages)
-- se aplicarán automáticamente a través de las vistas con security_invoker = true
