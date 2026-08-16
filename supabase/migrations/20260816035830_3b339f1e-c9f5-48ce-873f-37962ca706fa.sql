
-- Hardening all remaining SECURITY DEFINER functions in public schema
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.is_super_admin(uuid) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.next_invoice_no() SET search_path = public;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public;

-- Revoke public execution for non-auth internal helpers
-- Note: has_permission, has_role, is_staff, is_super_admin are often used in RLS policies 
-- which run as the calling user, so they might need EXECUTE by authenticated users.
-- We keep them as SECURITY DEFINER with SET search_path but limit EXECUTE where possible.
REVOKE EXECUTE ON FUNCTION public.next_invoice_no() FROM public;

-- Ensure stress_test_settings has a policy if enabled
DROP POLICY IF EXISTS "Service role only" ON public.stress_test_settings;
CREATE POLICY "Service role only" ON public.stress_test_settings FOR ALL TO service_role USING (true);
GRANT ALL ON public.stress_test_settings TO service_role;
