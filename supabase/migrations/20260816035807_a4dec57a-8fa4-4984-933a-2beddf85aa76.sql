
-- 1. Hardening Security Definer Functions
ALTER FUNCTION public.tr_orders_assign_invoice_no() SET search_path = public;
ALTER FUNCTION public.alert_on_invoice_collision() SET search_path = public;
ALTER FUNCTION public.increment_steadfast_count(order_id uuid, invoice_no text) SET search_path = public;
ALTER FUNCTION public.generate_next_invoice_no() SET search_path = public;
ALTER FUNCTION public.generate_next_invoice_no(boolean) SET search_path = public;

-- 2. Revoke Public Execution on Internal Security Definer Functions
REVOKE EXECUTE ON FUNCTION public.tr_orders_assign_invoice_no() FROM public;
REVOKE EXECUTE ON FUNCTION public.alert_on_invoice_collision() FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_steadfast_count(uuid, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no() FROM public;
REVOKE EXECUTE ON FUNCTION public.generate_next_invoice_no(boolean) FROM public;

-- 3. Enable RLS on remaining tables
ALTER TABLE public.stress_test_settings ENABLE ROW LEVEL SECURITY;

-- 4. Secure tables missing policies (Service Role only access where applicable)
DROP POLICY IF EXISTS "Service role only" ON public.courier_credentials;
CREATE POLICY "Service role only" ON public.courier_credentials FOR ALL TO service_role USING (true);
GRANT ALL ON public.courier_credentials TO service_role;

DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;
CREATE POLICY "Service role can manage login attempts" ON public.login_attempts FOR ALL TO service_role USING (true);
GRANT ALL ON public.login_attempts TO service_role;

DROP POLICY IF EXISTS "Staff can view mfa stats" ON public.mfa_backup_codes;
CREATE POLICY "Staff can view mfa stats" ON public.mfa_backup_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage mfa codes" ON public.mfa_backup_codes;
CREATE POLICY "Service role can manage mfa codes" ON public.mfa_backup_codes FOR ALL TO service_role USING (true);
GRANT ALL ON public.mfa_backup_codes TO service_role;

DROP POLICY IF EXISTS "Admins can view steadfast stats" ON public.steadfast_stats;
CREATE POLICY "Admins can view steadfast stats" ON public.steadfast_stats FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Service role can manage steadfast stats" ON public.steadfast_stats;
CREATE POLICY "Service role can manage steadfast stats" ON public.steadfast_stats FOR ALL TO service_role USING (true);
GRANT ALL ON public.steadfast_stats TO service_role;
