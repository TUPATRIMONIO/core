-- Full permissions for notary system views
-- This allows admin operations (approve, reject, update) via the public views

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signing_notary_offices TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signing_notary_services TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signing_notary_assignments TO authenticated, service_role;

-- Ensure RLS is handled by the underlying tables since views have security_invoker = true
-- (Already set in 20251212000011_expose_notary_views.sql)
